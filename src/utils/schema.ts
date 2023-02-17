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

import { getValueSchema } from '@/utils/yaml';

export const retrieveFromSchema = (
  defaultValues: { [key: string]: any },
  schema: { [key: string]: any },
  parentPath = '',
): { [key: string]: any } => {
  let params = [];
  if (schema && schema.properties) {
    const properties = schema.properties;
    Object.keys(properties).forEach((propertyKey) => {
      const itemPath = `${parentPath || ''}${propertyKey}`;
      const { type, form } = properties[propertyKey];
      if (form) {
        // Use the default value either from the JSON schema or the default values
        // 使用schema中的默认值
        // const value = properties[propertyKey].default
        // 使用values.yaml的默认值
        const value = getValueSchema(defaultValues, itemPath, properties[propertyKey].default);
        let children = undefined;
        if (properties[propertyKey].type === 'object') {
          children = retrieveFromSchema(defaultValues, properties[propertyKey], `${itemPath}/`);
        }
        // else if (
        //   properties[propertyKey].type === 'array' &&
        //   properties[propertyKey].items &&
        //   !Array.isArray(properties[propertyKey].items)
        // ) {
        //   type = 'list';
        // }
        const param = {
          ...properties[propertyKey],
          path: itemPath,
          name: propertyKey,
          type,
          value,
          enum: properties[propertyKey].enum?.map((item) => item?.toString() ?? ''),
          children: children,
        };
        params = params.concat(param);
      } else {
        // form为假不渲染
        // If the property is an object, iterate recursively 递归遍历
        if (schema.properties[propertyKey].type !== 'object') {
          params = params.concat(retrieveFromSchema(defaultValues, properties[propertyKey], `${itemPath}/`));
        }
      }
    });
  }
  return params;
};
