import { createContext, use, useState, type MouseEvent } from 'react';
import type { CheckState, TreeNode } from './tree';
import './tree-item.css';

/** Tree-wide flags and state accessors owned by {@link LUITree}, read by every item. */
export interface TreeContextValue {
  showLine: boolean;
  checkable: boolean;
  showIcon: boolean;
  isExpanded: (node: TreeNode) => boolean;
  isSelected: (node: TreeNode) => boolean;
  checkState: (node: TreeNode) => CheckState;
  toggleExpand: (node: TreeNode) => void;
  onRowClick: (node: TreeNode) => void;
  toggleCheck: (node: TreeNode) => void;
}

export const TreeContext = createContext<TreeContextValue | null>(null);

export interface LUITreeItemProps {
  node: TreeNode;
  /** Ancestor rail-continuation flags; length equals this node's depth. */
  guides?: readonly boolean[];
  isLast?: boolean;
}

/**
 * Recursive renderer for one {@link TreeNode} and its subtree. All state lives
 * in the parent `LUITree`; this component only reflects it and draws the
 * indentation rails. `guides` carries, per ancestor level, whether that level's
 * vertical rail continues past this node — the child rails are derived by
 * appending this node's own "has a following sibling" flag.
 *
 * @internal Consumers use `<LUITree>`, not this component directly.
 */
export function LUITreeItem({ node, guides = [], isLast = false }: LUITreeItemProps) {
  const tree = use(TreeContext);
  if (!tree) throw new Error('LUITreeItem must be rendered inside LUITree');

  const hasChildren = !!node.children?.length;
  const expanded = tree.isExpanded(node);
  const selected = tree.isSelected(node);
  const checkState = tree.checkState(node);
  const childGuides = [...guides, !isLast];

  // Lazily mount the subtree on first expand, then keep it so collapsing can
  // animate its height back to zero instead of blinking out of the DOM.
  const [mounted, setMounted] = useState(false);
  if (expanded && !mounted) setMounted(true);

  const onToggle = (event: MouseEvent): void => {
    event.stopPropagation();
    tree.toggleExpand(node);
  };

  return (
    <div className="l-tree-item">
      <div
        className={[
          'l-tree-item__row',
          selected ? 'is-selected' : '',
          node.disabled ? 'is-disabled' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={selected}
        aria-disabled={node.disabled || undefined}
        onClick={() => tree.onRowClick(node)}
      >
        {tree.showLine
          ? guides.map((g, i) => {
              const cellLast = i === guides.length - 1;
              return (
                <span
                  key={i}
                  className={['l-tree-item__guide', cellLast ? 'is-connector' : '']
                    .filter(Boolean)
                    .join(' ')}
                >
                  {cellLast ? (
                    <>
                      <span className="l-tree-item__elbow" />
                      {!isLast && <span className="l-tree-item__continue" />}
                    </>
                  ) : (
                    g && <span className="l-tree-item__through" />
                  )}
                </span>
              );
            })
          : guides.map((_, i) => <span key={i} className="l-tree-item__indent" />)}

        <span
          className={[
            'l-tree-item__switch',
            tree.showLine && hasChildren && expanded ? 'line-down' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {hasChildren && (
            <button
              type="button"
              className={['l-tree-item__toggle', expanded ? 'is-expanded' : '']
                .filter(Boolean)
                .join(' ')}
              aria-label={expanded ? 'Collapse' : 'Expand'}
              onClick={onToggle}
            >
              <svg
                className="l-tree-item__chevron"
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 1.5L6.5 5L3 8.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </span>

        {tree.checkable && (
          <input
            type="checkbox"
            className="l-tree-item__checkbox"
            checked={checkState === 'checked'}
            ref={(el) => {
              if (el) el.indeterminate = checkState === 'indeterminate';
            }}
            disabled={node.disabled || node.disableCheckbox}
            onClick={(event) => event.stopPropagation()}
            onChange={() => tree.toggleCheck(node)}
          />
        )}

        <span className="l-tree-item__content">
          {tree.showIcon && node.icon && (
            <span className="l-tree-item__icon" aria-hidden="true">
              {node.icon}
            </span>
          )}
          <span className="l-tree-item__label">{node.label}</span>
        </span>
      </div>

      {hasChildren && (
        <div
          className={['l-tree-item__children', expanded ? 'is-open' : '']
            .filter(Boolean)
            .join(' ')}
          role="group"
          inert={!expanded}
        >
          <div className="l-tree-item__children-inner">
            {mounted &&
              node.children!.map((child, i) => (
                <LUITreeItem
                  key={child.key}
                  node={child}
                  guides={childGuides}
                  isLast={i === node.children!.length - 1}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
