import { BusinessModel } from '../../types/scene-model';

export interface ValidationIssue {
    severity: 'error' | 'warning';
    message: string;
    field?: string;
}

export interface ValidationResult {
    isValid: boolean;
    score: number; // 0-100
    issues: ValidationIssue[];
}

class ValidationService {
    /**
     * Validates a business model working copy against basic integrity rules.
     * @param workingCopy The working copy of the business model
     */
    validate(workingCopy: BusinessModel['working_copy'] | undefined): ValidationResult {
        const issues: ValidationIssue[] = [];
        let score = 0;

        if (!workingCopy) {
            return { isValid: false, score: 0, issues: [{ severity: 'error', message: 'Model data is empty' }] };
        }

        // 1. Primary Business Object Check (Critical)
        // Check if ID exists and Status is 'accepted' (implied by being in workingCopy, but checking existence is good)
        if (workingCopy.primary_business_object && workingCopy.primary_business_object.label) {
            score += 30; // High weight
        } else {
            issues.push({
                severity: 'error',
                message: '必须定义核心业务对象 (Primary Business Object)',
                field: 'primary_business_object'
            });
        }

        // 2. Related Objects
        if (workingCopy.business_objects && workingCopy.business_objects.length > 0) {
            score += 10;
        }

        // 3. State Machine (Important for behavior)
        if (workingCopy.state_machine && workingCopy.state_machine.states && workingCopy.state_machine.states.length > 0) {
            score += 20;
            // Check connectivity? MVP: No.
            // Check terminal state?
            const hasTerminal = workingCopy.state_machine.states.some(s => s.is_terminal);
            if (!hasTerminal) {
                issues.push({ severity: 'warning', message: '状态机未定义终态 (Terminal State)' });
            } else {
                score += 5;
            }
        } else {
            // If strictly required? depends on template. For now, warning if missing maybe?
            // Actually, for some models it might be optional.
            // Let's assume it adds to score but isn't strictly blocking unless template says so.
        }

        // 4. Roles / Actions
        if (workingCopy.roles && workingCopy.roles.length > 0) score += 10;
        if (workingCopy.actions && workingCopy.actions.length > 0) score += 10;

        // 5. Rules / Constraints
        if (workingCopy.rules && workingCopy.rules.length > 0) score += 10;

        // 6. Artifacts
        if (workingCopy.artifacts &&
            (workingCopy.artifacts.materials.length > 0 || workingCopy.artifacts.data_checks.length > 0)) {
            score += 5;
        }

        // Cap score at 100
        score = Math.min(100, score);

        // Determine validity: No errors
        const isValid = !issues.some(i => i.severity === 'error');

        return {
            isValid,
            score,
            issues
        };
    }
}

export const validationService = new ValidationService();
