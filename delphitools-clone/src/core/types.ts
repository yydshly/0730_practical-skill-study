export type ToolCategory =
  | 'image'
  | 'editor'
  | 'color'
  | 'text'
  | 'print'
  | 'developer'
  | 'calculator'
  | 'special';

export type ToolId =
  | 'matte-generator'
  | 'scroll-generator'
  | 'social-cropper'
  | 'watermarker'
  | 'artwork-enhancer'
  | 'background-remover'
  | 'favicon-genny'
  | 'image-clipper'
  | 'image-converter'
  | 'image-splitter'
  | 'image-stitcher'
  | 'image-tracer'
  | 'paste-image'
  | 'placeholder-genny'
  | 'svg-optimiser'
  | 'base64-image-encoder'
  | 'editor'
  | 'colorblind-sim'
  | 'colour-converter'
  | 'contrast-checker'
  | 'gradient-genny'
  | 'harmony-genny'
  | 'palette-collection'
  | 'palette-extractor'
  | 'palette-genny'
  | 'pixel-picker'
  | 'tailwind-shades'
  | 'doc-converter'
  | 'text-editor'
  | 'font-explorer'
  | 'glyph-browser'
  | 'large-type'
  | 'line-height-calc'
  | 'paper-sizes'
  | 'px-to-rem'
  | 'text-diff'
  | 'typo-calc'
  | 'word-counter'
  | 'pdf-preflight'
  | 'imposer'
  | 'zine-imposer'
  | 'code-genny'
  | 'decoder'
  | 'meta-tag-genny'
  | 'qr-genny'
  | 'regex-tester'
  | 'tailwind-cheatsheet'
  | 'markdown-writer'
  | 'algebra-calc'
  | 'base-converter'
  | 'encoder'
  | 'graph-calc'
  | 'sci-calc'
  | 'time-calc'
  | 'unit-converter'
  | 'shavian-transliterator';

export type ToolMode = 'standard' | 'canvas';

export type ToolWorkspace =
  | 'image'
  | 'advanced-media'
  | 'editor'
  | 'color'
  | 'text'
  | 'print'
  | 'developer'
  | 'calculator'
  | 'special';

export type ToolDefinition = {
  id: ToolId;
  category: ToolCategory;
  title: string;
  englishTitle: string;
  description: string;
  keywords: readonly string[];
  workspace: ToolWorkspace;
  mode: ToolMode;
};

export type ToolCategoryDefinition = {
  id: ToolCategory;
  title: string;
  description: string;
};

export type ToolCapabilityStatus =
  | 'complete'
  | 'core-complete'
  | 'partial'
  | 'unavailable';

export type ToolExplanation = {
  toolId: ToolId;
  status: ToolCapabilityStatus;
  summary: string;
  capabilities: readonly string[];
  inputs: readonly string[];
  outputs: readonly string[];
  principle: readonly string[];
  workflow: readonly string[];
  privacy: string;
  limitations: readonly string[];
  unavailableReasons?: readonly string[];
  futureRequirements?: readonly string[];
};
