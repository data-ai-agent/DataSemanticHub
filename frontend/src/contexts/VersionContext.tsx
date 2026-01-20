import { createContext, useContext } from 'react';

export interface VersionContextValue {
    readOnly: boolean;
    versionId?: string;
}

export const READONLY_LABEL = '语义版本快照（只读）';
export const READONLY_HINT = '当前处于版本快照，仅可查看，编辑已禁用。';

const VersionContext = createContext<VersionContextValue>({ readOnly: false });

export const VersionProvider = VersionContext.Provider;

export const useVersionContext = () => useContext(VersionContext);
