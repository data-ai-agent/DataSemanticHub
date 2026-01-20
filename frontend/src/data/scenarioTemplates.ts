export interface ScenarioTemplate {
    id: string;
    title: string;
    description: string;
    category: string;
}

export const SCENARIO_TEMPLATES: ScenarioTemplate[] = [
    {
        id: 'disability_certificate',
        title: '残疾证申领流程',
        description: '申请人持本人身份证、户口簿和医疗机构出具的残疾证明，向户籍所在地县级残联提出申请。县级残联收到申请后，应当在规定期限内进行审核，符合条件的予以批准，发放残疾人证。',
        category: '民政服务',
    },
    {
        id: 'elderly_subsidy',
        title: '高龄津贴发放',
        description: '对80周岁以上老年人发放高龄津贴。申请人携带身份证和户口簿到社区服务中心提交申请，工作人员审核资格后，按月发放津贴到申请人银行账户。',
        category: '社会保障',
    },
    {
        id: 'business_license',
        title: '营业执照办理',
        description: '企业法人提交公司章程、股东会决议、场所证明等材料至市场监督管理局窗口。工作人员核验材料齐全后，进行受理并在3个工作日内完成审批。审批通过后，颁发营业执照。',
        category: '企业服务',
    },
    {
        id: 'housing_fund_withdrawal',
        title: '公积金提取',
        description: '职工因购买自住住房，需提取住房公积金的，应当向公积金管理中心提出申请，并提供购房合同、发票等证明材料。管理中心自受理申请之日起3日内作出准予提取或者不准提取的决定。',
        category: '便民服务',
    }
];
