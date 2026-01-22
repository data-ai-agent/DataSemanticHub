package com.eisoo.dc.gateway.service;


import com.eisoo.dc.common.metadata.entity.ClientIdEntity;
import com.github.yulichang.base.MPJBaseService;

public interface ClientIdService extends MPJBaseService<ClientIdEntity> {
    ClientIdEntity getClientIdAndSecret();

    ClientIdEntity reRegistClient();
}
