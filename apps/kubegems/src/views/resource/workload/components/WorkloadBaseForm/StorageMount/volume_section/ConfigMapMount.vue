<!--
 * Copyright 2022 The kubegems.io Authors
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *       http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License. 
-->

<template>
  <v-form ref="form" v-model="valid" lazy-validation @submit.prevent>
    <v-sheet class="px-2">
      <v-flex class="float-left text-subtitle-2 py-1 primary--text kubegems__min-width" />
      <v-flex class="float-left ml-2 kubegems__form-width">
        <v-autocomplete
          v-model="volumeName"
          class="my-0"
          color="primary"
          hide-selected
          :items="items"
          :label="$root.$t('resource.configmap')"
          :no-data-text="$root.$t('data.no_data')"
          :readonly="edit"
          :rules="volumeRules.ConfigMapRule"
          @change="onVolumeChange"
        >
          <template #selection="{ item }">
            <v-chip class="mx-1" color="primary" small>
              {{ item['text'] }}
            </v-chip>
          </template>
        </v-autocomplete>
      </v-flex>
      <div class="kubegems__clear-float" />
    </v-sheet>
    <v-sheet
      v-for="(item, index) in volumeCopy && volumeCopy.configMap.items ? volumeCopy.configMap.items : []"
      :key="index"
      class="px-2"
    >
      <v-flex class="float-left text-subtitle-2 py-1 primary--text kubegems__min-width" />
      <v-flex class="float-left ml-2 kubegems__form-width">
        <v-autocomplete
          v-model="volumeCopy.configMap.items[index].key"
          class="my-0"
          color="primary"
          hide-selected
          :items="configMapKeys"
          :label="$t('tip.configmap_key')"
          :no-data-text="$root.$t('data.no_data')"
          :rules="volumeRules[index].KeyRule"
          @focus="onConfigMapKeySelectFocus"
        >
          <template #selection="{ item }">
            <v-chip class="mx-1" color="primary" small>
              {{ item['text'] }}
            </v-chip>
          </template>
        </v-autocomplete>
      </v-flex>
      <v-flex class="float-left ml-2 kubegems__form-width">
        <v-text-field
          v-model="volumeCopy.configMap.items[index].path"
          class="my-0"
          :label="$t('tip.path')"
          required
          :rules="volumeRules[index].PathRule"
        />
      </v-flex>
      <v-btn class="mt-4" color="error" dark fab right text x-small @click="removeKV(index)">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
      <div class="kubegems__clear-float" />
    </v-sheet>
    <VolumeMount ref="volumeMount" :containers="containers" :volume="volume" :volume-mount-name="volumeMountName" />
    <VolumeMountForInitContainer
      v-if="initContainers && initContainers.length > 0"
      ref="volumeMountForInitContainer"
      :init-containers="initContainers"
      :volume="volume"
      :volume-mount-name="volumeMountName"
    />
  </v-form>
</template>

<script>
  import { required } from '@kubegems/extension/ruler';
  import { deepCopy } from '@kubegems/libs/utils/helpers';

  import messages from '../../../../i18n';
  import VolumeMount from './VolumeMount';
  import VolumeMountForInitContainer from './VolumeMountForInitContainer';
  import { getAppResourceFileMetas, getConfigMapDetail, getConfigMapList } from '@/api';
  import BaseResource from '@/mixins/resource';
  import { convertResponse2List } from '@/types/base';

  export default {
    name: 'ConfigMapMount',
    i18n: {
      messages: messages,
    },
    components: {
      VolumeMount,
      VolumeMountForInitContainer,
    },
    mixins: [BaseResource],
    props: {
      containers: {
        type: Array,
        default: () => [],
      },
      edit: {
        type: Boolean,
        default: () => false,
      },
      initContainers: {
        type: Array,
        default: () => [],
      },
      namespace: {
        type: String,
        default: () => '',
      },
      manifest: {
        type: Boolean,
        default: () => false,
      },
      volume: {
        type: Object,
        default: () => null,
      },
      volumeMountName: {
        type: String,
        default: () => null,
      },
    },
    data() {
      return {
        valid: false,
        items: [],
        configMapKeys: [],
        volumeName: null,
        volumeCopy: {
          configMap: {
            items: [],
          },
        },
      };
    },
    computed: {
      volumeObj() {
        const index = this.items.findIndex((v) => {
          return v.value === this.volumeName;
        });
        if (index > -1) return this.items[index];
        return null;
      },
      volumeRules() {
        const rule = { ConfigMapRule: [required] };
        if (this.volumeCopy && this.volumeCopy.configMap.items) {
          this.volumeCopy.configMap.items.forEach((i, index) => {
            rule[index] = {};
            rule[index].KeyRule = [required];
            rule[index].PathRule = [required];
          });
        }
        return rule;
      },
    },
    watch: {
      volume: {
        handler: function () {
          this.loadData();
        },
        deep: true,
      },
    },
    async mounted() {
      await this.configMapList();
      this.loadData();
    },
    methods: {
      loadData() {
        if (this.volume && this.volume.configMap) {
          this.volumeName = this.volume.configMap.name.replaceAll('.', '-');
          this.volumeCopy = deepCopy(this.volume);
          if (this.namespace.length > 0) {
            this.configMapDetail();
          }
        }
      },
      async configMapList() {
        let data = {};
        if (this.manifest) {
          data = await getAppResourceFileMetas(
            this.$route.query.tenantid,
            this.$route.query.projectid,
            this.ThisAppEnvironmentID,
            this.$route.params.name,
            {
              kind: 'ConfigMap',
            },
          );
          this.items = data;
        } else {
          data = await getConfigMapList(this.ThisCluster, this.namespace || this.$route.query.namespace, {
            size: 1000,
          });
          this.items = convertResponse2List(data);
        }
        this.items.forEach((v) => {
          v.text = v.metadata.name;
          v.value = v.metadata.name.replaceAll('.', '-');
        });
      },
      async configMapDetail() {
        const data = await getConfigMapDetail(
          this.ThisCluster,
          this.namespace || this.$route.query.namespace,
          this.volume?.configMap?.name || this.volumeName,
        );
        if (data.data) {
          for (const item in data.data) {
            this.configMapKeys.push({
              text: item,
              value: item,
            });
          }
        }
      },
      onVolumeChange() {
        this.$refs.volumeMount.initVolumeMount(this.volumeName);
        if (this.$refs.volumeMountForInitContainer) {
          this.$refs.volumeMountForInitContainer.initVolumeMount(this.volumeName);
        }
      },
      generateData() {
        if (this.$refs.form.validate(true)) {
          const data = this.$refs.volumeMount.generateData();
          if (data) {
            return {
              volumeMount: data,
              volume: {
                name: this.volume ? this.volume.name : this.volumeName,
                configMap: {
                  name: this.volumeObj.text,
                  defaultMode: 420,
                  items: this.volumeCopy.configMap.items ? this.volumeCopy.configMap.items : [],
                },
              },
            };
          }
          return null;
        }
        return null;
      },
      generateInitData() {
        if (this.$refs.form.validate(true)) {
          const data = this.$refs.volumeMountForInitContainer.generateData();
          if (data) {
            return {
              init: data,
            };
          }
          return null;
        }
        return null;
      },
      removeKV(index) {
        this.$delete(this.volumeCopy.configMap.items, index);
      },
      addItem() {
        if (!this.volumeCopy.configMap.items) this.volumeCopy.configMap.items = [];
        this.volumeCopy.configMap.items.push({ key: '', path: '' });
      },
      onConfigMapKeySelectFocus() {
        this.configMapDetail();
      },
    },
  };
</script>