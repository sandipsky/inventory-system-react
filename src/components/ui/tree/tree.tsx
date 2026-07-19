import { useState } from 'react';
import { LUITreeItem, TreeContext, type TreeContextValue } from './tree-item';
import './tree.css';

/** A single node in the tree data. Children make it a branch; none makes it a leaf. */
export interface TreeNode {
  /** Unique key across the whole tree. */
  key: string;
  label: string;
  children?: TreeNode[];
  /** Optional glyph/emoji shown when `showIcon` is on. */
  icon?: string;
  /** Not selectable and (with `checkable`) its checkbox is skipped by cascade. */
  disabled?: boolean;
  /** Disable just this node's checkbox. */
  disableCheckbox?: boolean;
}

export type CheckState = 'checked' | 'indeterminate' | 'unchecked';

export interface LUITreeProps {
  nodes?: readonly TreeNode[];
  /** Show a checkbox on every node. */
  checkable?: boolean;
  /** Draw the connecting rails between nodes. */
  showLine?: boolean;
  /** Render each node's `icon`. */
  showIcon?: boolean;
  /** Allow selecting (highlighting) nodes on click. */
  selectable?: boolean;
  /** Allow more than one node to be selected. */
  multiple?: boolean;
  /** Uncouple parent/child checkboxes (no cascade, no indeterminate). */
  checkStrictly?: boolean;

  /** Keys of the expanded branches. Controlled when provided (pair with `onExpandedKeysChange`). */
  expandedKeys?: string[];
  /** Keys of the checked nodes. Controlled when provided (pair with `onCheckedKeysChange`). */
  checkedKeys?: string[];
  /** Keys of the selected nodes. Controlled when provided (pair with `onSelectedKeysChange`). */
  selectedKeys?: string[];
  /** Initial expanded keys when `expandedKeys` is uncontrolled. */
  defaultExpandedKeys?: string[];
  /** Initial checked keys when `checkedKeys` is uncontrolled. */
  defaultCheckedKeys?: string[];
  /** Initial selected keys when `selectedKeys` is uncontrolled. */
  defaultSelectedKeys?: string[];

  onExpandedKeysChange?: (keys: string[]) => void;
  onCheckedKeysChange?: (keys: string[]) => void;
  onSelectedKeysChange?: (keys: string[]) => void;

  /** Called with the clicked node (fires even when selection is off/disabled). */
  onNodeClick?: (node: TreeNode) => void;
  onSelectedChange?: (nodes: TreeNode[]) => void;
  onCheckedChange?: (nodes: TreeNode[]) => void;
  onExpandedChange?: (change: { node: TreeNode; expanded: boolean }) => void;

  className?: string;
}

/**
 * Every branch-node key in `nodes` — pass to `expandedKeys` to expand the whole
 * tree (the React stand-in for the Angular component's `expandAll()` method;
 * `collapseAll()` is just `[]`).
 */
export function collectBranchKeys(nodes: readonly TreeNode[]): string[] {
  const keys: string[] = [];
  const walk = (list: readonly TreeNode[]): void => {
    for (const node of list) {
      if (node.children?.length) {
        keys.push(node.key);
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return keys;
}

/**
 * Tree view with Reddit-style connecting rails, inspired by Ant Design's `Tree`.
 * Data-driven via `nodes`; expand/collapse, selection and (optional) cascading
 * checkboxes are all owned here and read by the recursive {@link LUITreeItem}
 * renderer. Expanded / checked / selected state works uncontrolled (with
 * `default*Keys` initializers) or controlled via the `*Keys` +
 * `on*KeysChange` prop pairs.
 *
 * ```tsx
 * <LUITree nodes={data} checkable expandedKeys={open} onExpandedKeysChange={setOpen} />
 * <button onClick={() => setOpen(collectBranchKeys(data))}>Expand all</button>
 * ```
 */
export function LUITree({
  nodes = [],
  checkable = false,
  showLine = true,
  showIcon = false,
  selectable = true,
  multiple = false,
  checkStrictly = false,
  expandedKeys: expandedKeysProp,
  checkedKeys: checkedKeysProp,
  selectedKeys: selectedKeysProp,
  defaultExpandedKeys,
  defaultCheckedKeys,
  defaultSelectedKeys,
  onExpandedKeysChange,
  onCheckedKeysChange,
  onSelectedKeysChange,
  onNodeClick,
  onSelectedChange,
  onCheckedChange,
  onExpandedChange,
  className,
}: LUITreeProps) {
  const [internalExpanded, setInternalExpanded] = useState<string[]>(
    () => expandedKeysProp ?? defaultExpandedKeys ?? [],
  );
  const [internalChecked, setInternalChecked] = useState<string[]>(
    () => checkedKeysProp ?? defaultCheckedKeys ?? [],
  );
  const [internalSelected, setInternalSelected] = useState<string[]>(
    () => selectedKeysProp ?? defaultSelectedKeys ?? [],
  );

  const expandedKeys = expandedKeysProp ?? internalExpanded;
  const checkedKeys = checkedKeysProp ?? internalChecked;
  const selectedKeys = selectedKeysProp ?? internalSelected;

  const setExpandedKeys = (next: string[]): void => {
    setInternalExpanded(next);
    onExpandedKeysChange?.(next);
  };
  const setCheckedKeys = (next: string[]): void => {
    setInternalChecked(next);
    onCheckedKeysChange?.(next);
  };
  const setSelectedKeys = (next: string[]): void => {
    setInternalSelected(next);
    onSelectedKeysChange?.(next);
  };

  const expandedSet = new Set(expandedKeys);
  const checkedSet = new Set(checkedKeys);
  const selectedSet = new Set(selectedKeys);

  /* key → node and key → parentKey lookups, rebuilt when `nodes` changes. */
  const index = (() => {
    const map = new Map<string, TreeNode>();
    const parent = new Map<string, string | undefined>();
    const walk = (list: readonly TreeNode[], parentKey: string | undefined): void => {
      for (const node of list) {
        map.set(node.key, node);
        parent.set(node.key, parentKey);
        if (node.children?.length) walk(node.children, node.key);
      }
    };
    walk(nodes, undefined);
    return { map, parent };
  })();

  const hasCheckedDescendant = (node: TreeNode, checked: ReadonlySet<string>): boolean =>
    node.children?.some(
      (child) => checked.has(child.key) || hasCheckedDescendant(child, checked),
    ) ?? false;

  const checkState = (node: TreeNode): CheckState => {
    if (checkedSet.has(node.key)) return 'checked';
    if (!checkStrictly && hasCheckedDescendant(node, checkedSet)) return 'indeterminate';
    return 'unchecked';
  };

  const setSubtree = (node: TreeNode, target: boolean, set: Set<string>): void => {
    if (!node.disabled && !node.disableCheckbox) {
      if (target) set.add(node.key);
      else set.delete(node.key);
    }
    node.children?.forEach((child) => setSubtree(child, target, set));
  };

  const recomputeAncestors = (node: TreeNode, set: Set<string>): void => {
    const { map, parent } = index;
    let parentKey = parent.get(node.key);
    while (parentKey) {
      const parentNode = map.get(parentKey)!;
      const kids = (parentNode.children ?? []).filter((c) => !c.disabled && !c.disableCheckbox);
      const allChecked = kids.length > 0 && kids.every((c) => set.has(c.key));
      if (allChecked) set.add(parentKey);
      else set.delete(parentKey);
      parentKey = parent.get(parentKey);
    }
  };

  const context: TreeContextValue = {
    showLine,
    checkable,
    showIcon,
    isExpanded: (node) => expandedSet.has(node.key),
    isSelected: (node) => selectedSet.has(node.key),
    checkState,
    toggleExpand: (node) => {
      const set = new Set(expandedKeys);
      if (set.has(node.key)) set.delete(node.key);
      else set.add(node.key);
      setExpandedKeys([...set]);
      onExpandedChange?.({ node, expanded: set.has(node.key) });
    },
    onRowClick: (node) => {
      onNodeClick?.(node);
      if (!selectable || node.disabled) return;
      const wasSelected = selectedSet.has(node.key);
      let next: string[];
      if (multiple) {
        const set = new Set(selectedKeys);
        if (wasSelected) set.delete(node.key);
        else set.add(node.key);
        next = [...set];
      } else {
        next = wasSelected ? [] : [node.key];
      }
      setSelectedKeys(next);
      onSelectedChange?.(next.map((k) => index.map.get(k)!).filter(Boolean));
    },
    toggleCheck: (node) => {
      if (node.disabled || node.disableCheckbox) return;
      const set = new Set(checkedKeys);
      if (checkStrictly) {
        if (set.has(node.key)) set.delete(node.key);
        else set.add(node.key);
      } else {
        const target = checkState(node) !== 'checked';
        setSubtree(node, target, set);
        recomputeAncestors(node, set);
      }
      setCheckedKeys([...set]);
      onCheckedChange?.([...set].map((k) => index.map.get(k)!).filter(Boolean));
    },
  };

  return (
    <div className={['l-tree', className ?? ''].filter(Boolean).join(' ')} role="tree">
      <TreeContext value={context}>
        {nodes.map((node, i) => (
          <LUITreeItem key={node.key} node={node} guides={[]} isLast={i === nodes.length - 1} />
        ))}
      </TreeContext>
    </div>
  );
}
