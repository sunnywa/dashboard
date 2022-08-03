export const SIDEBAR_ITEMS = [
  {
    text: 'cluster',
    sidebar: 'cluster',
    value: 'admin-workspace',
    icon: 'mdi:kubernetes',
    admin: true,
  },
  {
    text: 'runtime',
    sidebar: 'dashboard',
    value: 'resource-dashboard',
    icon: 'mdi:kubernetes',
    required: ['tenant'],
  },
  {
    text: 'runtime',
    sidebar: 'projectspace',
    value: 'project-detail',
    icon: 'mdi:kubernetes',
    required: ['tenant', 'project'],
  },
  {
    text: 'runtime',
    sidebar: 'workspace',
    value: 'environment-detail',
    icon: 'mdi:kubernetes',
    required: ['tenant', 'project', 'environment'],
  },
  {
    text: 'microservice',
    sidebar: 'microservice',
    value: 'microservice',
    icon: 'mdi:arrow-decision',
    dependencies: ['istio'],
    admin: 'all',
  },
  {
    text: 'microservice',
    sidebar: 'virtualspace',
    value: 'microservice',
    icon: 'mdi:arrow-decision',
    required: ['virtualspace'],
    dependencies: ['istio'],
  },
  {
    text: 'observability',
    sidebar: 'observe',
    value: 'admin-observe',
    icon: 'mdi:camera-timer',
    admin: true,
  },
  {
    text: 'observability',
    sidebar: 'workspaceobserve',
    value: 'observe',
    icon: 'mdi:camera-timer',
  },
  {
    text: 'administration',
    sidebar: 'platform',
    value: 'platform',
    icon: 'mdi:view-gallery',
    admin: true,
  },
];
