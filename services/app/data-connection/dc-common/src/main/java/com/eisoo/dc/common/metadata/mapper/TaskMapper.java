package com.eisoo.dc.common.metadata.mapper;

import com.eisoo.dc.common.metadata.entity.TaskEntity;
import com.eisoo.dc.common.metadata.entity.TaskEntityQuery;
import com.github.yulichang.base.MPJBaseMapper;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.util.List;

/*
 * @Author paul
 *
 **/
public interface TaskMapper extends MPJBaseMapper<TaskEntity> {
    @Select("SELECT * FROM task_info WHERE task_id = #{taskId}")
    List<TaskEntity> selectJoinOne(@Param("taskId") String taskId);

    List<TaskEntity> batchTaskIds(@Param("taskIds") List<String> taskIds);

    @Select("<script>" +
            "SELECT task_id, sub_task_id, state " +
            "FROM task_info " +
            "WHERE task_id IN " +
            "<foreach item='taskId' index='index' collection='taskIds' open='(' separator=',' close=')'>" +
            "#{taskId}" +
            "</foreach>" +
            "</script>")
    List<TaskEntityQuery> batchTaskIds1(@Param("taskIds") List<String> taskIds);

    int updateTaskStateBatch(@Param("taskIds") List<String> taskIds, @Param("state") String state, @Param("updateTime") String updateTime);

    int updateQueryStateBatch(@Param("taskIds") List<String> taskIds, @Param("state") String state, @Param("updateTime") String updateTime);

    @Update("UPDATE task_info SET state = #{state}, update_time = #{updateTime} WHERE task_id = #{taskId}")
    int updateTaskStateSingle(@Param("taskId") String taskId, @Param("state") String state, @Param("updateTime") String updateTime);

    @Update("UPDATE task_info SET state = #{state}, update_time = #{updateTime} WHERE task_id = #{taskId}")
    int updateQueryStateSingle(@Param("taskId") String taskId, @Param("state") String state, @Param("updateTime") String updateTime);

    @Delete("DELETE FROM task_info WHERE task_id = #{taskId}")
    int deleteTaskById(@Param("taskId") String taskId);

    @Delete("DELETE FROM query_info WHERE task_id = #{taskId}")
    int deleteQueryById(@Param("taskId") String taskId);
}
