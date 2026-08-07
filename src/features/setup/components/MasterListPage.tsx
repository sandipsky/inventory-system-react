import { useMemo, useState, type ReactNode } from 'react'
import {
  LUIButton,
  LUICard,
  LUIChip,
  LUIConfirmDialog,
  LUIFilter,
  LUIFlex,
  LUIIcon,
  LUIPagination,
  LUITable,
  LUITableCell,
  useLUIDrawer,
  useLUIModal,
  useLUINotification,
  type FilterChange,
  type FilterColumn,
  type PageEvent,
  type TableColumn,
  type TableSort,
} from '@/components'
import { createMasterApi, getErrorMessage } from '../master.api'
import { createMasterQueries } from '../master.query'
import type { IMasterEntity } from '../master.types'
import MasterForm from './MasterForm'

const DEFAULT_COLUMNS: TableColumn[] = [
  { key: 'sn', header: 'S.N.', width: '70px' },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'is_active', header: 'Status', width: '120px', align: 'center' },
  { key: 'actions', header: 'Actions', width: '110px', align: 'center' },
]

const STATUS_FILTER: FilterColumn = {
  name: 'Status',
  formcontrolName: 'is_active',
  type: 'select',
  data: [
    { id: '1', name: 'Active' },
    { id: '0', name: 'Inactive' },
  ],
}

const TAX_RATE_FILTER: FilterColumn = {
  name: 'Tax Rate',
  formcontrolName: 'tax_rate',
  type: 'text',
}

export interface MasterListPageProps {
  /** Singular label, e.g. "Category" — drives the add button, dialogs and toasts. */
  title: string
  /** REST base path of the resource, e.g. '/master/categorys' (also the query cache key). */
  endpoint: string
  columns?: TableColumn[]
  /** Adds the tax-rate form field, filter and validation — for the tax type master. */
  withTaxRate?: boolean
  /** Extra `LUITableCell` renderers for feature-specific columns (may also override defaults). */
  children?: ReactNode
}

/**
 * Complete setup-master page: search + filters, server-sorted and paginated
 * table, add/edit form in a drawer, delete behind a confirm dialog.
 *
 * ```tsx
 * <MasterListPage title="Category" endpoint="/master/categorys" />
 * ```
 */
export default function MasterListPage({
  title,
  endpoint,
  columns = DEFAULT_COLUMNS,
  withTaxRate = false,
  children,
}: MasterListPageProps) {
  const drawer = useLUIDrawer()
  const modal = useLUIModal()
  const notify = useLUINotification()

  const queries = useMemo(() => createMasterQueries(endpoint, createMasterApi(endpoint)), [endpoint])
  const filterColumns = withTaxRate ? [STATUS_FILTER, TAX_RATE_FILTER] : [STATUS_FILTER]

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isFetching } = queries.useList({
    pageIndex,
    pageSize,
    ...(sort && { sort: `${sort.key}:${sort.direction}` }),
    ...filters,
  })
  const deleteEntity = queries.useDelete()

  const rows = data?.content ?? []
  const totalCount = data?.totalElements ?? 0

  const onFilterChange = (changes: FilterChange[]) => {
    const next: Record<string, string> = {}
    for (const change of changes) {
      if (change.value) next[change.field] = change.value
    }
    setFilters(next)
    setPageIndex(0)
  }

  const onPageChange = (event: PageEvent) => {
    setPageIndex(event.pageIndex)
    setPageSize(event.pageSize)
  }

  const onSortChange = (next: TableSort | null) => {
    setSort(next)
    setPageIndex(0)
  }

  const openForm = (entity?: IMasterEntity) => {
    drawer.open<boolean>(
      (ref) => (
        <MasterForm
          drawerRef={ref}
          title={title}
          queries={queries}
          entity={entity}
          withTaxRate={withTaxRate}
        />
      ),
      { size: '420px' },
    )
  }

  const confirmDelete = (entity: IMasterEntity) => {
    const ref = modal.open<boolean>(
      (modalRef) => (
        <LUIConfirmDialog
          modalRef={modalRef}
          data={{
            title: `Delete ${title}`,
            message: `Are you sure you want to delete "${entity.name}"? This cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () =>
              deleteEntity.mutateAsync(entity.id).catch((error) => {
                notify.error('Delete Failed', getErrorMessage(error))
                throw error
              }),
          }}
        />
      ),
      { width: '420px' },
    )

    void ref.afterClosed().then((confirmed) => {
      if (confirmed) notify.success(`${title} Deleted`, `"${entity.name}" has been removed.`)
    })
  }

  return (
    <>
      <LUIFlex justify="space-between" align="center">
        <LUIFilter searchBy="name" filterColumns={filterColumns} onFilterChange={onFilterChange} />

        <LUIButton onClick={() => openForm()}>Add {title}</LUIButton>
      </LUIFlex>

      <LUICard className="table-card">
        <LUITable
          columns={columns}
          data={rows}
          rowKey="id"
          serverSort
          sort={sort}
          onSortChange={onSortChange}
          loading={isFetching}
          emptyText={`No ${title.toLowerCase()} records found`}
        >
          <LUITableCell<IMasterEntity> column="sn">
            {({ index }) => pageIndex * pageSize + index + 1}
          </LUITableCell>

          <LUITableCell<IMasterEntity> column="is_active">
            {({ row }) => (
              <LUIChip variant={row.is_active ? 'success' : 'error'} dot>
                {row.is_active ? 'Active' : 'Inactive'}
              </LUIChip>
            )}
          </LUITableCell>

          <LUITableCell<IMasterEntity> column="actions">
            {({ row }) => (
              <LUIFlex justify="center" gap="small">
                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`Edit ${row.name}`}
                  onClick={() => openForm(row)}
                >
                  <LUIIcon name="edit" size={16} />
                </LUIButton>

                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`Delete ${row.name}`}
                  onClick={() => confirmDelete(row)}
                >
                  <LUIIcon name="trash" size={16} />
                </LUIButton>
              </LUIFlex>
            )}
          </LUITableCell>

          {children}
        </LUITable>

        <LUIPagination
          length={totalCount}
          pageIndex={pageIndex}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </LUICard>
    </>
  )
}
