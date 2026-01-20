import { useState, useCallback, useEffect } from 'react';
import { RecognitionRun, CandidateItem, BusinessModel, CandidateSet } from '../../../../types/scene-model';

export const useCandidateManager = (initialRun: RecognitionRun | null) => {
    // We keep a local copy of candidates to track their status changes
    // In a real app, this might be a deep merge if analysis runs multiple times
    const [candidates, setCandidates] = useState<CandidateSet | null>(null);
    const [workingCopy, setWorkingCopy] = useState<BusinessModel['working_copy'] | null>(null);

    // Initialize from run
    useEffect(() => {
        if (initialRun) {
            setCandidates(JSON.parse(JSON.stringify(initialRun.candidates)));
        }
    }, [initialRun]);

    // Helper to find and update a candidate by ID
    const updateCandidateStatus = useCallback((id: string, type: string, status: CandidateItem['status']) => {
        setCandidates((prev: CandidateSet | null) => {
            if (!prev) return null;
            const next = { ...prev };

            // Helper to recursively search and update
            // optimized for our known structure
            const updateInList = (list: CandidateItem[]) => {
                const item = list.find(i => i.id === id);
                if (item) {
                    item.status = status;
                    return true;
                }
                return false;
            };

            // Search in Business Objects
            if (updateInList([next.business_objects.primary_object])) return next;
            if (updateInList(next.business_objects.related_objects)) return next;

            // Search in Roles
            if (updateInList(next.roles)) return next;

            // Search in Actions
            if (updateInList(next.actions)) return next;

            // Search in Artifacts
            if (updateInList(next.artifacts.materials)) return next;
            if (updateInList(next.artifacts.data_checks)) return next;

            return next;
        });
    }, []);

    // Sync candidates to working copy whenever candidates change
    useEffect(() => {
        if (!candidates || !initialRun) return;

        const newWorkingCopy: BusinessModel['working_copy'] = {
            template_id: initialRun.scene_id, // Should use template_id ideally
            primary_business_object: candidates.business_objects.primary_object.status === 'accepted'
                ? candidates.business_objects.primary_object : {} as CandidateItem,
            business_objects: candidates.business_objects.related_objects.filter(i => i.status === 'accepted'),
            // Sync relations and fields (assuming relevant if objects are accepted - for MVP we copy all)
            relations: candidates.business_objects.relations,
            field_suggestions: candidates.business_objects.field_suggestions,

            roles: candidates.roles.filter(i => i.status === 'accepted'),
            actions: candidates.actions.filter(i => i.status === 'accepted'),
            artifacts: {
                materials: candidates.artifacts.materials.filter(i => i.status === 'accepted'),
                data_checks: candidates.artifacts.data_checks.filter(i => i.status === 'accepted'),
            },
            state_machine: {
                primary_object: candidates.state_machine.primary_object,
                states: candidates.state_machine.states,
                transitions: candidates.state_machine.transitions
            },
            rules: candidates.constraints.eligibility_rules.filter(i => i.status === 'accepted')
        };

        setWorkingCopy(newWorkingCopy);
    }, [candidates, initialRun]);

    const acceptCandidate = useCallback((id: string, type: string) => {
        updateCandidateStatus(id, type, 'accepted');
    }, [updateCandidateStatus]);

    const rejectCandidate = useCallback((id: string, type: string) => {
        updateCandidateStatus(id, type, 'rejected');
    }, [updateCandidateStatus]);

    const editCandidate = useCallback((id: string, type: string) => {
        // Placeholder for edit mode
        console.log('Edit candidate', id);
    }, []);

    return {
        candidates,
        workingCopy,
        acceptCandidate,
        rejectCandidate,
        editCandidate
    };
};
