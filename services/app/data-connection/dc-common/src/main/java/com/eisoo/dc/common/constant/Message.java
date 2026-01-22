package com.eisoo.dc.common.constant;

public class Message {

    public final static String MESSAGE_INPUT_NOT_EMPTY = "输入不能为空";

    public final static String MESSAGE_AUTH_SERVICE_ERROR_SOLUTION = "请检查权限微服务(auth-service)状态是否正常。具体操作可参考：《数据虚拟化引擎故障排除指南》。";

    public final static String MESSAGE_PARAM_ERROR_SOLUTION = "请使用请求参数构造规范化的请求字符串，详细信息参见产品 API 文档。";

    public final static String MESSAGE_DATANOTEXIST_ERROR_SOLUTION = "请检查参数是否正确或对应数据是否存在，详细信息参见产品 API 文档。";

    public final static String MESSAGE_PATHVARIABLE_ERROR_SOLUTION = "请使用正确的占位符参数构造URL，详细信息参见产品 API 文档。";

    public final static String MESSAGE_MaxUploadSizeExceededException = "上传的文件大小超出了有效值，详细信息参见产品 API 文档。";

    public final static String MESSAGE_MultipartException = "未上传文件或上传文件异常，详细信息参见产品 API 文档。";

    public final static String MESSAGE_REQUEST_METHOD_UNSUPPORTED_SOLUTION = "当前请求方式为：[%s]，支持的接口请求方式有：[%s]，请使用接口支持的请求方式重试，详细信息参见产品 API 文档。";

    public final static String MESSAGE_Duplicated_SOLUTION = "数据重复，请检查数据或重试，重试再次失败，请联系技术人员进行检查处理。";

    public final static String MESSAGE_INTERNAL_ERROR = "未具体分类的内部错误，请联系技术支持进行检查处理。";

    public final static String MESSAGE_SYSTEM_BUSY = "请稍后重试。如果重试后仍无法解决您的问题，请联系技术支持。";

    public final static String MESSAGE_DATABASE_ERROR_SOLUTION = "请检查数据库服务状态和相关日志，具体操作可参考：《数据虚拟化引擎故障排除指南》。";

    public final static String MESSAGE_CALCULATE_ERROR = "请检查数据虚拟化引擎计算微服务(vega-calculate-coordinator, vega-calculate-worker)配置及状态是否正常，具体操作可参考：《数据虚拟化引擎故障排除指南》。";

    public final static String MESSAGE_AUTHORIZATION_SOLUTION = "请核实认证信息，确保通过认证，详细信息参见产品 API 文档。";

    public final static String MESSAGE_RESOURCE_AUTHORIZATION_SOLUTION = "请核实授权信息，确保拥有对应操作权限，详细信息参见产品 API 文档。";

    public final static String MESSAGE_SERVICE_ERROR = "检查异常服务状态及日志，或联系技术支持进行检查处理。";

    public final static String MESSAGE_OPERATION_EXECUTION = "请检查是否存在操作限制，详细信息参见产品 API 文档。";
}
