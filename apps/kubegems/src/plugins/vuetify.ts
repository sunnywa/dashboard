/*
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
 */
import Vue from 'vue';
import Vuetify from 'vuetify';
import '@/scss/vuetify/overrides.scss';

Vue.use(Vuetify);

const theme: { [key: string]: string } = {
  primary: '#01305F',
  info: '#7B88A9',
  success: '#64bb3a',
  accent: '#fc4b6c',
  default: '#563dea',
};

export default new Vuetify({
  theme: {
    themes: {
      dark: theme,
      light: theme,
    },
  },
});
