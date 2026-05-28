/**
 * 产品品类 DTO
 */

export interface ProductCategoryFieldConfig {
  /** 字段编码 */
  code: string;
  /** 字段名称 */
  name: string;
  /** 字段类型 */
  type: 'string' | 'number' | 'select' | 'date';
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 选项列表（select类型用） */
  options?: { label: string; value: string }[];
  /** 排序 */
  sort?: number;
}

export interface ProductCategoryDto {
  id?: number;
  code: string;
  name: string;
  unit: string;
  fields?: ProductCategoryFieldConfig[];
  status?: string;
  sort?: number;
}

// 预定义品类字段配置
export const CATEGORY_FIELD_CONFIGS: Record<string, ProductCategoryFieldConfig[]> = {
  mortar: [
    { code: 'mortarGrade', name: '砂浆标号', type: 'string', sort: 1 },
    { code: 'packingType', name: '包装类型', type: 'select', required: true, options: [
      { label: '散装', value: 'bulk' },
      { label: '袋包', value: 'bagged' }
    ], sort: 2 },
    { code: 'licensePlate', name: '车牌号', type: 'string', sort: 3 }
  ],
  block: [
    { code: 'convertedCubic', name: '折立方', type: 'number', required: true, sort: 1 },
    { code: 'frameTaken', name: '带去铁架', type: 'number', sort: 2 },
    { code: 'frameReturned', name: '带回铁架', type: 'number', sort: 3 },
    { code: 'remarks', name: '备注', type: 'string', sort: 4 }
  ],
  board: [
    { code: 'thickness', name: '厚度(mm)', type: 'number', sort: 1 },
    { code: 'length', name: '长度(m)', type: 'number', sort: 2 },
    { code: 'width', name: '宽度(m)', type: 'number', sort: 3 },
    { code: 'layers', name: '层数', type: 'number', sort: 4 }
  ],
  steel: [
    { code: 'diameter', name: '直径(mm)', type: 'number', sort: 1 },
    { code: 'length', name: '长度(m)', type: 'number', sort: 2 },
    { code: 'weight', name: '理论重量(kg)', type: 'number', sort: 3 }
  ]
};

// 预定义品类信息
export const DEFAULT_CATEGORIES: ProductCategoryDto[] = [
  { code: 'mortar', name: '砂浆', unit: '吨', fields: CATEGORY_FIELD_CONFIGS.mortar, sort: 1 },
  { code: 'block', name: '蒸压加气混凝土砌块', unit: '块', fields: CATEGORY_FIELD_CONFIGS.block, sort: 2 },
  { code: 'board', name: '保温板', unit: '平方米', fields: CATEGORY_FIELD_CONFIGS.board, sort: 3 },
  { code: 'steel', name: '钢筋', unit: '吨', fields: CATEGORY_FIELD_CONFIGS.steel, sort: 4 }
];
