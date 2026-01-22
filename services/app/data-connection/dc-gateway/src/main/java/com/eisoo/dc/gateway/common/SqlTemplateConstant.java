package com.eisoo.dc.gateway.common;

public class SqlTemplateConstant {
    public static final String SELECT_TEMPLATE = "select %s from ${table}";
    public static final String WHERE_TEMPLATE = "WHERE ";
    public static final String NOTNULL_CONDITION = "(\"%s\") IS NOT NULL";
    public static final String NOTNULL_AND_NONEMPTY_CONDITION = "( \"%s\" IS NOT NULL OR TRIM(\"%s\") != '' )";
    public static final String LIMIT_CONDITION = " LIMIT 1";


    public static final String COUNT_TABLE ="COUNT(\"%s\") AS \"COUNT_%s\"";
    public static final String NULL_COUNT="COUNT(CASE WHEN \"%s\" IS NULL THEN 1 ELSE NULL END) AS \"NULL_COUNT_%s\"";
    public static final String BLANK_COUNT="COUNT(CASE WHEN (\"%s\" IS NULL or trim(CAST( \"%s\" AS string)) ='') THEN 1 ELSE NULL END) AS \"BLANK_COUNT_%s\"";
    public static final String MAX="Max(\"%s\") AS \"MAX_%s\" ";
    public static final String MIN="MIN(\"%s\") AS \"MIN_%s\"";
    public static final String ZERO="COUNT(CASE WHEN \"%s\" = 0 THEN 1  ELSE NULL END) AS \"ZERO_%s\"";
    public static final String AVG="Round(Avg(\"%s\"),2) AS \"AVG_%s\"";
    public static final String STD="stddev_pop(\"%s\") AS \"STD_%s\"";
    public static final String VAR="var_pop(\"%s\") AS \"VAR_%s\"";
    public static final String TRUE="COUNT(CASE WHEN \"%s\" =TRUE THEN 1 ELSE NULL END) AS \"TRUE_%s\"";
    public static final String FALSE="COUNT(CASE WHEN \"%s\" = FALSE THEN 1 ELSE NULL END) AS \"FALSE_%s\"";
    public static final String APPROX="approx_percentile(\"%s\",0.25) AS \"APPROX_25_%s\", approx_percentile(\"%s\",0.50) AS \"APPROX_50_%s\", approx_percentile(\"%s\",0.75) AS \"APPROX_75_%s\"";

    public static final String DAY_LIMIT=" SELECT * FROM (SELECT substr(cast(date_trunc('DAY', \"%s\") as string),1,10) as name,count(1) as total,'%s' AS TYPE,'DAY' AS FLAG FROM %s  group by substr(cast(date_trunc('DAY', \"%s\") as string),1,10))";
    public static final String DAY_LIMIT_SQL=" SELECT * FROM (SELECT substr(cast(date_trunc('DAY', \"%s\") as string),1,10) as name,count(1) as total,'%s' AS TYPE,'DAY' AS FLAG  FROM  %s group by substr(cast(date_trunc('DAY', \"%s\") as string),1,10) limit %s)";
    public static final String MONTH_LIMIT="SELECT * FROM (SELECT  substr(cast(date_trunc('MONTH', \"%s\") as string),1,7) as name,count(1) as total,'%s' AS TYPE,'MONTH' AS FLAG FROM %s  group by  substr(cast(date_trunc('MONTH', \"%s\") as string),1,7))";
    public static final String MONTH_LIMIT_SQL="SELECT * FROM (SELECT  substr(cast(date_trunc('MONTH', \"%s\") as string),1,7) as name,count(1) as total,'%s' AS TYPE,'MONTH' AS FLAG FROM %s  group by  substr(cast(date_trunc('MONTH', \"%s\") as string),1,7) limit %s)";
    public static final String YEAR_LIMIT="SELECT * FROM (SELECT  substr(cast(date_trunc('YEAR', \"%s\") as string),1,4) as name,count(1) as total,'%s' AS TYPE,'YEAR' AS FLAG FROM %s  group by  substr(cast(date_trunc('YEAR', \"%s\") as string),1,4))";
    public static final String YEAR_LIMIT_SQL="SELECT * FROM (SELECT  substr(cast(date_trunc('YEAR', \"%s\") as string),1,4) as name,count(1) as total,'%s' AS TYPE,'YEAR' AS FLAG FROM %s  group by  substr(cast(date_trunc('YEAR', \"%s\") as string),1,4) limit %s)";
    public static final String GROUP_Template="SELECT * FROM (SELECT cast(\"%s\" as string) as name,count(1) as total,'%s' AS TYPE,'GROUP' AS FLAG  FROM  %s group by cast(\"%s\" as string) order by total desc limit %s)";
    public static final String GROUP_SINGLE="SELECT * FROM (SELECT cast(\"%s\" as string) as name,count(1) as total,'%s' AS TYPE,'GROUP' AS FLAG  FROM  %s group by cast(\"%s\" as string) order by total desc)";








}
