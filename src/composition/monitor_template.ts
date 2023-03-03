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

import { convertResponse2Pagination } from '@/types/base';
import { MonitorTemplate } from '@/types/monitor_template';

export const useMonitorTemplatePagination = async (
  template: MonitorTemplate,
  page = 1,
  size = 10,
  search = '',
): Promise<Pagination<MonitorTemplate>> => {
  const _data: KubePaginationResponse<MonitorTemplate[]> = await template.getMonitorTemplateList({
    page: page,
    size: size,
    search: search,
  });

  return convertResponse2Pagination<MonitorTemplate>(_data);
};
