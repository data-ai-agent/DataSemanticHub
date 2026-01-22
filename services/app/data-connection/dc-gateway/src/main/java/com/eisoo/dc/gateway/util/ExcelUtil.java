package com.eisoo.dc.gateway.util;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class ExcelUtil {
    /**
     * Cell.getCellStyle().getDataFormatString()
     */
    private static final List<String> EXCEL_FORMAT_INDEX_TIMESTAMP_STRING = Arrays.asList(
            //年月日时分秒
            "yyyy/m/d\\ h:mm;@", "m/d/yy h:mm",
            "yyyy/m/d\\ h:mm\\ AM/PM", "[$-409]yyyy/m/d\\ h:mm\\ AM/PM;@", "yyyy/mm/dd\\ hh:mm:dd",
            "yyyy/mm/dd\\ hh:mm", "yyyy/m/d\\ h:m", "yyyy/m/d\\ h:m:s", "yyyy/m/d\\ h:mm", "m/d/yy h:mm;@",
            "yyyy/m/d\\ h:mm\\ AM/PM;@",

            //年月日
            "m/d/yy", "[$-F800]dddd\\,\\ mmmm\\ dd\\,\\ yyyy",
            "[DBNum1][$-804]yyyy\"年\"m\"月\"d\"日\";@", "yyyy\"年\"m\"月\"d\"日\";@", "yyyy/m/d;@", "yy/m/d;@", "m/d/yy;@",
            "[$-409]d/mmm/yy", "[$-409]dd/mmm/yy;@", "reserved-0x1F", "reserved-0x1E", "mm/dd/yy;@", "yyyy/mm/dd",
            "d-mmm-yy", "[$-409]d\\-mmm\\-yy;@", "[$-409]d\\-mmm\\-yy", "[$-409]dd\\-mmm\\-yy;@",
            "[$-409]dd\\-mmm\\-yy", "[DBNum1][$-804]yyyy\"年\"m\"月\"d\"日\"", "yy/m/d", "mm/dd/yy", "dd\\-mmm\\-yy",

            //年月
            "[DBNum1][$-804]yyyy\"年\"m\"月\";@",
            "[DBNum1][$-804]yyyy\"年\"m\"月\"", "yyyy\"年\"m\"月\";@", "yyyy\"年\"m\"月\"", "[$-409]mmm\\-yy;@",
            "[$-409]mmm\\-yy", "[$-409]mmm/yy;@", "[$-409]mmm/yy", "[$-409]mmmm/yy;@", "[$-409]mmmm/yy",
            "[$-409]mmmmm/yy;@", "[$-409]mmmmm/yy", "mmm-yy", "yyyy/mm", "mmm/yyyy", "[$-409]mmmm\\-yy;@",
            "[$-409]mmmmm\\-yy;@", "mmmm\\-yy", "mmmmm\\-yy",

            //月日
            "[DBNum1][$-804]m\"月\"d\"日\";@",
            "[DBNum1][$-804]m\"月\"d\"日\"", "m\"月\"d\"日\";@", "m\"月\"d\"日\"", "[$-409]d/mmm;@", "[$-409]d/mmm", "m/d;@",
            "m/d", "d-mmm", "d-mmm;@", "mm/dd", "mm/dd;@", "[$-409]d\\-mmm;@", "[$-409]d\\-mmm",

            //星期
            "[$-804]aaaa;@", "[$-804]aaaa",

            //周
            "[$-804]aaa;@", "[$-804]aaa",

            //月
            "[$-409]mmmmm;@", "mmmmm", "[$-409]mmmmm",

            //时间
            "mm:ss.0", "h:mm", "h:mm\\ AM/PM", "h:mm:ss",
            "h:mm:ss\\ AM/PM", "reserved-0x20", "reserved-0x21", "[DBNum1]h\"时\"mm\"分\"", "[DBNum1]上午/下午h\"时\"mm\"分\"",
            "mm:ss", "[h]:mm:ss", "h:mm:ss;@", "[$-409]h:mm:ss\\ AM/PM;@", "h:mm;@", "[$-409]h:mm\\ AM/PM;@",
            "h\"时\"mm\"分\";@", "h\"时\"mm\"分\"\\ AM/PM;@", "h\"时\"mm\"分\"ss\"秒\";@", "h\"时\"mm\"分\"ss\"秒\"_ AM/PM;@",
            "上午/下午h\"时\"mm\"分\";@", "上午/下午h\"时\"mm\"分\"ss\"秒\";@", "[DBNum1][$-804]h\"时\"mm\"分\";@",
            "[DBNum1][$-804]上午/下午h\"时\"mm\"分\";@", "h:mm AM/PM", "h:mm:ss AM/PM", "[$-F400]h:mm:ss\\ AM/PM");

    public boolean isExcelFile(String fileName) {
        return StringUtils.isNotEmpty(fileName) && fileName.toLowerCase().endsWith(".xlsx");
    }

    public String guessColumnType(Cell cell, Workbook workbook) {
        if (cell == null) {
            return "varchar";
        }
        switch (cell.getCellType()) {
            case STRING:
                return "varchar";
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return "timestamp";
                } else {

                    String dataFormatString = cell.getCellStyle().getDataFormatString();
                    if (EXCEL_FORMAT_INDEX_TIMESTAMP_STRING.contains(dataFormatString)) {
                        return "timestamp";
                    }

                    Long longValue = Math.round(cell.getNumericCellValue());
                    Double doubleValue = cell.getNumericCellValue();
                    if (Double.parseDouble(longValue + ".0") == doubleValue) {
                        return "bigint";
                    } else {
                        return "double";
                    }
                }
            case BOOLEAN:
                return "boolean";
            case FORMULA:
                FormulaEvaluator evaluator = workbook.getCreationHelper().createFormulaEvaluator();
                CellValue cellValue = evaluator.evaluate(cell);
                switch (cellValue.getCellType()) {
                    case STRING:
                        return "varchar";
                    case NUMERIC:
                        Long longValue = Math.round(cellValue.getNumberValue());
                        Double doubleValue = cellValue.getNumberValue();
                        if (Double.parseDouble(longValue + ".0") == doubleValue) {
                            return "bigint";
                        } else {
                            return "double";
                        }
                    case BOOLEAN:
                        return "boolean";
                    default: return "varchar";
                }
            default: return "varchar";
        }
    }
}
