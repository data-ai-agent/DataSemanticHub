package cn.aishu.telemetry.log;

/**
 * 爱数内部Service类的替代实现，用于编译兼容
 */
public class Service {
    private String name;
    private String version;
    private String instanceId;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getInstanceId() {
        return instanceId;
    }

    public void setInstanceId(String instanceId) {
        this.instanceId = instanceId;
    }
}