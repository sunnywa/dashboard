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
  <FormWizard
    ref="deploy"
    :back-button-text="$root.$t('operate.previous')"
    :class="`px-8 pt-8`"
    color="#1e88e5"
    error-color="#e74c3c"
    :finish-button-text="$root.$t('operate.deploy')"
    :next-button-text="$root.$t('operate.next')"
    shape="tab"
    :start-index="0"
    step-size="sm"
    subtitle=""
    title=""
  >
    <TabContent
      :before-change="validateBaseInfo"
      :class="`zoom-${Scale.toString().replaceAll('.', '-')} kubegems__wizard-tab-content mt-8`"
      icon="mdi mdi-information"
      :title="$t('tip.base_info')"
    >
      <v-form ref="form" v-model="valid" class="wizard-form-content" lazy-validation @submit.prevent>
        <v-row>
          <v-col class="my-2">
            <v-text-field
              v-model="obj.AppName"
              class="my-4"
              flat
              :label="$t('form.appname')"
              required
              :rules="objRules.appNameRules"
              @change="onAppNameChange"
            />
            <v-autocomplete
              v-model="obj.TenantProjectId"
              class="my-4"
              color="primary"
              hide-selected
              item-text="text"
              :items="m_select_tenantProjectItems"
              :label="$root.$t('resource.project')"
              :menu-props="{
                bottom: true,
                left: true,
                origin: `top center`,
              }"
              :no-data-text="$root.$t('data.no_data')"
              :rules="objRules.tenantProjectIdRules"
              @focus="onTenantProjectSelectFocus"
            >
              <template #selection="{ item }">
                <v-chip color="primary" small>
                  {{ item['text'] }}
                </v-chip>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col class="my-2">
            <v-autocomplete
              v-model="obj.selectVersion"
              class="my-4"
              color="primary"
              hide-selected
              :items="versions"
              :label="$t('form.version')"
              :menu-props="{
                bottom: true,
                left: true,
                origin: `top center`,
              }"
              :no-data-text="$root.$t('data.no_data')"
              :rules="objRules.versionRules"
              @change="onAppVersionChange"
            >
              <template #selection="{ item }">
                <v-chip color="primary" small>
                  {{ item }}
                </v-chip>
              </template>
            </v-autocomplete>

            <v-autocomplete
              v-model="obj.EnvironmentId"
              class="my-4"
              color="primary"
              hide-selected
              :items="m_select_projectEnvironmentItems"
              :label="$root.$t('resource.environment')"
              :menu-props="{
                bottom: true,
                left: true,
                origin: `top center`,
              }"
              :no-data-text="$root.$t('data.no_data')"
              :rules="objRules.environmentIdRules"
              @focus="onEnvSelectFocus"
            >
              <template #selection="{ item }">
                <v-chip class="mx-1" color="primary" small>
                  {{ item['text'] }}
                </v-chip>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
      </v-form>
    </TabContent>
    <TabContent
      :class="`zoom-${Scale.toString().replaceAll('.', '-')} kubegems__wizard-tab-content mt-12`"
      icon="mdi mdi-cog"
      :lazy="false"
      :title="$t('tip.advance_setting')"
    >
      <v-tabs v-model="tab" height="30" rounded-t @change="onTabChange">
        <v-tab v-for="item in tabItems" :key="item.value">
          {{ item.text }}
          <Tips v-if="tab === 0 && selectRepo !== 'kubegems'" class="mx-1" :msg="$t('tip.third_registry_deploy')" />
        </v-tab>
      </v-tabs>
      <div v-if="tab === 0" class="py-2" :style="{ height: `${height - 40}px` }">
        <JsonSchema
          ref="jsonSchema"
          :app-values="appValues"
          class="mt-0"
          :cluster-name="clusterName"
          :params="params"
          @changeBasicFormParam="changeBasicFormParam"
        />
      </div>
      <div v-else class="py-2">
        <ACEEditor
          v-model="appValuesYaml"
          :class="`clear-zoom-${Scale.toString().replaceAll('.', '-')} rounded`"
          lang="yaml"
          :options="Object.assign($aceOptions, { readOnly: false, wrap: true })"
          :style="{ height: `${height * Scale - 50}px !important` }"
          theme="chrome"
          @keydown.stop
        />
      </div>
      <AppStoreDeployLoading :dialog="deployDialog" />
    </TabContent>
    <TabContent
      :class="`zoom-${Scale.toString().replaceAll('.', '-')} kubegems__wizard-tab-content mt-12`"
      icon="mdi mdi-check"
      :lazy="false"
      :title="$t('tip.complete')"
    >
      <AppStoreComplete v-if="completed" class="mt-12 pt-12" @showDeployStatus="showDeployStatus" />
    </TabContent>
    <template #footer="props">
      <v-flex class="kubegems__wizard-footer" :style="`right:${footerWidth}px;`">
        <v-btn v-show="props.activeTabIndex > 0" color="primary" text @click.native="props.prevTab()">
          {{ $root.$t('operate.previous') }}
        </v-btn>
        <v-btn v-if="props.activeTabIndex === 0" color="primary" text @click.native="nextStep(props)">
          {{ $root.$t('operate.next') }}
        </v-btn>

        <v-btn
          v-if="props.activeTabIndex === 1"
          color="primary"
          :loading="Circular"
          text
          @click.native="deployAppStore(props)"
        >
          {{ $root.$t('operate.deploy') }}
        </v-btn>
      </v-flex>
    </template>
  </FormWizard>
</template>

<script>
  import { getAppStoreFiles, postDeployAppStore, postImportPrometheusRule } from '@kubegems/api/direct';
  import { k8sName, required } from '@kubegems/extension/ruler';
  import { deepCopy } from '@kubegems/libs/utils/helpers';
  import { retrieveFromSchema } from '@kubegems/libs/utils/schema';
  import { deleteValue, setValue, setYamlValue } from '@kubegems/libs/utils/yaml';
  import BasePermission from '@kubegems/mixins/permission';
  import BaseResource from '@kubegems/mixins/resource';
  import BaseSelect from '@kubegems/mixins/select';
  import { Base64 } from 'js-base64';
  import { FormWizard, TabContent } from 'vue-form-wizard';
  import { mapGetters, mapState } from 'vuex';

  import messages from '../../i18n';
  import AppStoreComplete from './AppStoreComplete';
  import AppStoreDeployLoading from './AppStoreDeployLoading';
  import Tips from './Tips';

  import 'vue-form-wizard/dist/vue-form-wizard.min.css';

  export default {
    name: 'DeployWizard',
    i18n: {
      messages: messages,
    },
    components: {
      AppStoreComplete,
      AppStoreDeployLoading,
      FormWizard,
      JsonSchema: () => import('./JsonSchema'),
      TabContent,
      Tips,
    },
    mixins: [BasePermission, BaseResource, BaseSelect],
    props: {
      currentApp: {
        type: Object,
        default: () => ({}),
      },
      files: {
        type: Object,
        default: () => ({}),
      },
      selectRepo: {
        type: String,
        default: () => '',
      },
      versions: {
        type: Array,
        default: () => [],
      },
    },
    data() {
      return {
        obj: {
          AppName: '',
          TenantProjectId: '',
          EnvironmentId: '',
          selectVersion: '',
          app: null,
        },
        valid: false,
        appValues: {},
        appValuesOrigin: {},
        appValuesYaml: null,
        schemaJson: {},
        yamlMode: false,
        params: [],
        currentStep: 1,
        timeout: null,
        deployDialog: false,
        completed: false,
        tab: 0,
        filesCopy: {},
      };
    },
    computed: {
      ...mapState(['Auth', 'Circular', 'AdminViewport', 'Scale', 'Locale']),
      ...mapGetters(['Tenant', 'Project', 'Environment']),
      objRules() {
        return {
          appNameRules: [required, k8sName],
          versionRules: [required],
          tenantProjectIdRules: [required],
          environmentIdRules: [required],
        };
      },
      clusterName() {
        const projectEnvironmentObj = this.m_select_projectEnvironmentItems.find((e) => {
          return e.value === this.obj.EnvironmentId;
        });
        return projectEnvironmentObj ? projectEnvironmentObj.clusterName : '';
      },
      footerWidth() {
        return (window.innerWidth / 12) * 9 + 10;
      },
      height() {
        // 还原缩放系数zoom-0-9带来的像素差别
        return (window.innerHeight - 64 - 1 - 24 - 8 - 88) / this.Scale;
      },
      showForm() {
        return this.filesCopy?.['values.schema.json'] !== undefined && this.filesCopy?.['values.schema.json'] !== null;
      },
      tabItems() {
        return [
          { text: this.$t('tab.form'), value: 'SchemaForm' },
          { text: 'Values', value: 'ValuesForm' },
        ];
      },
    },
    watch: {
      files: {
        handler(newValue) {
          this.filesCopy = deepCopy(newValue);
        },
        deep: true,
      },
    },
    destroyed() {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }
    },
    methods: {
      validateBaseInfo() {
        const ret = this.$refs.form.validate(true);
        this.currentStep = ret ? 2 : 1;
        return ret;
      },
      validateJsonSchema() {
        return this.$refs.jsonSchema.validate();
      },
      async parseFiles() {
        this.readme = this.filesCopy?.['README.md'] || {};
        if (this.filesCopy?.['values.schema.json']) {
          this.schemaJson = JSON.parse(this.filesCopy?.['values.schema.json'] || '{}');
        }
        if (this.Locale !== 'zh-Hans' && this.Locale !== 'zh-Hant') {
          if (this.filesCopy?.['i18n/values.en.json']) {
            const enSchemaJson = JSON.parse(this.filesCopy?.['i18n/values.en.json'] || '{}');
            this.schemaJson = Object.assign(this.schemaJson, enSchemaJson);
          } else {
            this.$store.commit('SET_SNACKBAR', {
              text: this.$t('tip.no_i18n_file'),
              color: 'warning',
            });
          }
        }
        if (this.filesCopy?.['values.yaml']) {
          this.appValues = this.$yamlload(this.filesCopy?.['values.yaml']) || {};
          this.appValuesOrigin = this.$yamlload(this.filesCopy?.['values.yaml']) || {};
          this.appValuesYaml = this.$yamldump(this.appValuesOrigin);
        }
        if (Object.keys(this.appValues)?.length === 0) {
          this.$store.commit('SET_SNACKBAR', {
            text: this.$t('tip.values_error'),
            color: 'warning',
          });
          return;
        }
        // 获取所有需要渲染的参数列表
        this.params = retrieveFromSchema(this.appValues, this.schemaJson);
      },
      changeBasicFormParam(param, value, operate = 'changed', path = '') {
        // Change raw values 修改原始值, 返回的是字符串
        if (operate === 'changed') {
          const parentPath = param.path.substr(0, param.path.lastIndexOf('/'));
          const typeFlag = param.path.substr(param.path.lastIndexOf('/') + 1);
          if (parseInt(typeFlag) === 0) {
            this.appValues = setValue(this.appValues, parentPath, []);
          }
          this.appValues = setValue(this.appValues, param.path, value);
        } else if (operate === 'deleted') {
          this.appValues = deleteValue(this.appValues, path);
        } else if (operate === 'set') {
          this.appValues = setValue(this.appValues, path, value);
        }
        this.reRender();
      },
      reRender() {
        this.params = [];
        this.params = retrieveFromSchema(this.appValues, this.schemaJson);
      },
      async deployAppStore() {
        if (this.yamlMode || !this.showForm) {
          this.appValues = this.$yamlload(this.appValuesYaml);
          this.runDeploy();
        } else {
          if (this.validateJsonSchema()) {
            // 解除验证错误
            this.$refs.deploy.setValidationError(null);
            this.runDeploy();
            // 提前加载项目环境
          } else {
            // 手动触发校验失败,标题显示红色样式
            this.$refs.deploy.setValidationError(new Error(this.$t('tip.params_check_error')));
          }
        }
      },
      async runDeploy() {
        const jsonData = {
          name: this.obj.AppName,
          project_id: this.obj.TenantProjectId,
          environment_id: this.obj.EnvironmentId,
          repoURL: this.currentApp.repoURL,
          chart: this.obj.app,
          chartVersion: this.obj.selectVersion,
          tenant_id: this.Tenant().ID,
          values: this.appValues,
          annotations: {
            'application.kubegems.io/repo': this.selectRepo,
          },
        };
        this.deployDialog = true;
        this.timeout = setTimeout(() => {
          this.deployDialog = false;
          clearTimeout(this.timeout);
        }, 3000);
        await postDeployAppStore(this.Tenant().ID, this.obj.TenantProjectId, this.obj.EnvironmentId, jsonData);

        // 添加告警规则
        if (this.filesCopy?.['alerts.yaml']) {
          const environment = this.m_select_projectEnvironmentItems.find((e) => {
            return e.value === this.obj.EnvironmentId;
          });
          const alertsYaml = this.filesCopy?.['alerts.yaml']
            .replaceAll('__namespace__', environment?.namespace)
            .replaceAll('__fullname__', this.obj.AppName)
            .replaceAll(new RegExp('name: ([\\w-_]+)', 'g'), `name: ${this.obj.AppName}-$1`);
          await postImportPrometheusRule(environment?.clusterName, environment?.namespace, alertsYaml);
        }

        this.$refs.deploy.nextTab();
        this.deployDialog = false;
        if (this.timeout) clearTimeout(this.timeout);
        this.completed = true;
      },
      async onEnvSelectFocus() {
        await this.m_select_projectEnvironmentSelectData(this.obj.TenantProjectId);
        // 系统管理员->租户管理员->项目管理员(auth中有项目ID)->其他,断路判断是否启用环境过滤
        this.m_select_projectEnvironmentItems = this.m_select_projectEnvironmentItems.filter((projectEnv) => {
          return (
            this.m_permisson_tenantAllow() ||
            this.Auth.projects.some((p) => {
              return (p.isAdmin || p.role === 'ops' || p.role === 'test') && p.id === this.obj.TenantProjectId;
            }) ||
            this.Auth.environments.some((authEnv) => {
              return (authEnv.isAdmin || authEnv.role === 'operator') && authEnv.name === projectEnv.text;
            })
          );
        });
      },
      async showDeployStatus() {
        const project = this.m_select_tenantProjectItems.find((p) => {
          return p.value === this.obj.TenantProjectId;
        });
        if (!project) {
          this.$store.commit('SET_SNACKBAR', {
            text: this.$t('tip.project_is_null'),
            color: 'warning',
          });
          return;
        }
        const environment = this.m_select_projectEnvironmentItems.find((e) => {
          return e.value === this.obj.EnvironmentId;
        });

        if (!environment) {
          this.$store.commit('SET_SNACKBAR', {
            text: this.$t('tip.environment_is_null'),
            color: 'warning',
          });
          return;
        }
        this.$router.push({
          name: 'app-detail',
          params: {
            name: this.obj.AppName,
            tenant: this.Tenant().TenantName,
            project: project.text,
            environment: environment.environmentName,
          },
          query: {
            projectid: this.obj.TenantProjectId,
            tenantid: this.Tenant().ID,
            kind: 'appstore',
            namespace: environment.Namespace,
          },
        });
      },
      onAppNameChange() {
        this.appValues.nameOverride = this.obj.AppName;
        this.appValues.fullnameOverride = this.obj.AppName;

        this.appValuesYaml = setYamlValue(this.appValuesYaml, 'nameOverride', this.obj.AppName);
        this.appValuesYaml = setYamlValue(this.appValuesYaml, 'fullnameOverride', this.obj.AppName);

        // 数据驱动组件重新渲染
        this.params = [];
        this.params = retrieveFromSchema(this.appValues, this.schemaJson);
      },
      reset() {
        this.$refs.deploy.reset();
        if (this.$refs.form) {
          this.$refs.form?.reset();
        }
        if (this.$refs.jsonSchema) {
          this.$refs.jsonSchema?.reset();
        }
      },
      async nextStep(props) {
        this.tab = 1;
        await props.nextTab();
        // 手动切换tab
        if (this.showForm) {
          this.tab = 0;
        }
      },
      async onAppVersionChange() {
        if (this.obj.selectVersion) {
          await this.appStoreFiles();
          this.parseFiles();
          this.onAppNameChange();
        }
      },
      async appStoreFiles() {
        const res = await getAppStoreFiles({
          name: this.currentApp.name,
          version: this.obj.selectVersion,
          reponame: this.selectRepo,
        });
        const files = res.files || {};
        Object.keys(files).forEach((name) => {
          files[name] = Base64.decode(files[name]);
        });
        this.filesCopy = files;
      },
      onTabChange() {
        if (this.tab === 0) {
          this.yamlMode = false;
          this.reRender();
        } else {
          this.yamlMode = true;
        }
      },
      onTenantProjectSelectFocus() {
        this.m_select_tenantProjectSelectData();
      },
      setData(data) {
        this.obj = Object.assign(this.obj, data);
      },
    },
  };
</script>

<style lang="scss">
  /* 覆盖样式 */
  .vue-form-wizard .wizard-tab-content {
    padding: 0 0 0;
  }
  .vue-form-wizard .wizard-card-footer {
    padding: 0 0;
  }
  .wizard-form-content {
    margin-bottom: 0;
    padding: 0;
  }
  .vue-form-wizard .wizard-header {
    padding: 0;
  }
  .vue-form-wizard {
    padding-bottom: 0;
  }
</style>
