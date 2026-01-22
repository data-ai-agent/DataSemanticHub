package com.eisoo.dc.common.constant;

public class ResourceAuthConstant {

    /**
     * 资源类型：数据源
     */
    public static final String RESOURCE_TYPE_DATA_SOURCE = "data_connection";

    /**
     * 资源操作类型：显示列表
     */
    public static final String RESOURCE_OPERATION_TYPE_DISPLAY = "display";

    /**
     * 资源操作类型：查看详情
     */
    public static final String RESOURCE_OPERATION_TYPE_VIEW_DETAIL = "view_detail";

    /**
     * 资源操作类型：创建
     */
    public static final String RESOURCE_OPERATION_TYPE_CREATE = "create";

    /**
     * 资源操作类型：修改
     */
    public static final String RESOURCE_OPERATION_TYPE_MODIFY = "modify";

    /**
     * 资源操作类型：删除
     */
    public static final String RESOURCE_OPERATION_TYPE_DELETE = "delete";

    /**
     * 资源操作类型：扫描
     */
    public static final String RESOURCE_OPERATION_TYPE_SCAN = "scan";

    /**
     * 资源操作类型：权限管理
     */
    public static final String RESOURCE_OPERATION_TYPE_AUTHORIZE = "authorize";

    /**
     * 新建数据源后允许操作：显示列表、查看详情、编辑、删除、扫描、权限管理
     */
    public static final String[] ALLOW_OPERATION_DATA_SOURCE_CREATED = new String[]{
            RESOURCE_OPERATION_TYPE_DISPLAY,
            RESOURCE_OPERATION_TYPE_VIEW_DETAIL,
            RESOURCE_OPERATION_TYPE_MODIFY,
            RESOURCE_OPERATION_TYPE_DELETE,
            RESOURCE_OPERATION_TYPE_SCAN,
            RESOURCE_OPERATION_TYPE_AUTHORIZE
    };

    /**
     * 用户类型：实名账户
     */
    public static final String USER_TYPE_USER = "user";

    /**
     * 用户类型：应用账户
     */
    public static final String USER_TYPE_APP = "app";

}
