export const PROJECT_PROVENANCE = {
  referenceSite: {
    label: 'delphitools 参考网页',
    url: 'https://tools.rmv.fyi/',
  },
  sourceRepository: {
    label: 'delphitools 官方源码库',
    url: 'https://github.com/1612elphi/delphitools',
  },
  license: {
    label: 'MIT License',
    url: 'https://github.com/1612elphi/delphitools/blob/main/LICENSE',
  },
  relationship: '当前项目是独立中文实现，不是 delphitools 的官方网站、官方版本或镜像。此前实现主要依据参考网页可见的功能和交互，官方源码库从当前收尾阶段开始用于核对真实能力与实现边界。',
  licenseNote: '官方源码库采用 MIT License。后续如直接复用或修改官方源码，需要保留原作者版权和许可证声明。',
  progress: '当前尚未全部完成：批次 1 已收口；批次 2 已完成本地批处理基础、图像像素算法和五个图像变换工作流，其余图像输入与颜色、SVG、二维码与条码、PDF、编辑器边界及最终说明同步仍待继续。',
  toolNote: '这里描述的是当前中文项目的实际实现，不代表参考网页或官方源码库的完整能力。',
} as const;
