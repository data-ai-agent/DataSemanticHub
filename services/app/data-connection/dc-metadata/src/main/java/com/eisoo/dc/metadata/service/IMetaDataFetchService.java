package com.eisoo.dc.metadata.service;

import com.eisoo.dc.common.metadata.entity.TaskScanEntity;

public interface IMetaDataFetchService {
    void getTables(TaskScanEntity taskScanEntity,String userId) throws Exception;

    void getFieldsByTable(String table) throws Exception;

}
