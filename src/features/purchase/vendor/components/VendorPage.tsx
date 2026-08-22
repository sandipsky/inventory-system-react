import { useState } from 'react'
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
import { useAuthStore } from '@/features/auth'
import { getErrorMessage } from '../vendor.api'
import { useVendorList, useDeleteVendor } from '../vendor.query'
import type { IVendor } from '../vendor.types'
import VendorForm from './VendorForm'

const columns: TableColumn[] = [
  { key: 'sn', header: 'S.N.', width: '70px' },
  { key: 'name', header: 'Vendor Name', sortable: true },
  { key: 'contact', header: 'Contact', sortable: true },
  { key: 'email', header: 'Email', sortable: true },
  { key: 'address', header: 'Address', sortable: true },
  { key: 'registration_number', header: 'Registration No.', sortable: true },
  { key: 'isActive', header: 'Status', width: '120px', align: 'center' },
  { key: 'actions', header: 'Actions', width: '150px', align: 'center' },
]

const STATUS_OPTIONS = [
  { id: '1', name: 'Active' },
  { id: '0', name: 'Inactive' },
]

const filterColumns: FilterColumn[] = [
  { name: 'Contact', formcontrolName: 'contact', type: 'text' },
  { name: 'Email', formcontrolName: 'email', type: 'text' },
  { name: 'Registration Number', formcontrolName: 'registrationNumber', type: 'text' },
  { name: 'Status', formcontrolName: 'isActive', type: 'select', data: STATUS_OPTIONS },
]

const VendorPage = () => {
  const drawer = useLUIDrawer()
  const modal = useLUIModal()
  const notify = useLUINotification()

  const operations = useAuthStore((s) => s.operations)
  const canCreate = operations.includes('CreateVendor')
  const canEdit = operations.includes('EditVendor')
  const canDelete = operations.includes('DeleteVendor')

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isFetching } = useVendorList({
    pageIndex,
    pageSize,
    ...(sort && { sort: `${sort.key}:${sort.direction}` }),
    ...filters,
  })
  const deleteVendor = useDeleteVendor()

  const vendors = data?.content ?? []
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

  const openForm = (vendor?: IVendor, view = false) => {
    drawer.open<boolean>((ref) => <VendorForm drawerRef={ref} vendor={vendor} view={view} />, {
      size: '640px',
    })
  }

  const confirmDelete = (vendor: IVendor) => {
    const ref = modal.open<boolean>(
      (modalRef) => (
        <LUIConfirmDialog
          modalRef={modalRef}
          data={{
            title: 'Delete Vendor',
            message: `Are you sure you want to delete "${vendor.name}"? This cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () =>
              deleteVendor.mutateAsync(vendor.id).catch((error) => {
                notify.error('Delete Failed', getErrorMessage(error))
                throw error
              }),
          }}
        />
      ),
      { width: '420px' },
    )

    void ref.afterClosed().then((confirmed) => {
      if (confirmed) notify.success('Vendor Deleted', `"${vendor.name}" has been removed.`)
    })
  }

  return (
    <>
      <LUIFlex justify="space-between" align="center">
        <LUIFilter
          searchBy="name"
          filterColumns={filterColumns}
          onFilterChange={onFilterChange}
        />

        {canCreate && <LUIButton onClick={() => openForm()}>Add Vendor</LUIButton>}
      </LUIFlex>

      <LUICard className="table-card">
        <LUITable
          columns={columns}
          data={vendors}
          rowKey="id"
          serverSort
          sort={sort}
          onSortChange={onSortChange}
          loading={isFetching}
          emptyText="No vendors found"
        >
          <LUITableCell<IVendor> column="sn">
            {({ index }) => pageIndex * pageSize + index + 1}
          </LUITableCell>

          <LUITableCell<IVendor> column="isActive">
            {({ row }) => (
              <LUIChip variant={row.is_active ? 'success' : 'error'} dot>
                {row.is_active ? 'Active' : 'Inactive'}
              </LUIChip>
            )}
          </LUITableCell>

          <LUITableCell<IVendor> column="actions">
            {({ row }) => (
              <LUIFlex justify="center" gap="small">
                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`View ${row.name}`}
                  onClick={() => openForm(row, true)}
                >
                  <LUIIcon name="eye" size={16} />
                </LUIButton>

                {canEdit && (
                  <LUIButton
                    variant="outlined"
                    size="sm"
                    rounded
                    aria-label={`Edit ${row.name}`}
                    onClick={() => openForm(row)}
                  >
                    <LUIIcon name="edit" size={16} />
                  </LUIButton>
                )}

                {canDelete && (
                  <LUIButton
                    variant="outlined"
                    size="sm"
                    rounded
                    aria-label={`Delete ${row.name}`}
                    onClick={() => confirmDelete(row)}
                  >
                    <LUIIcon name="trash" size={16} />
                  </LUIButton>
                )}
              </LUIFlex>
            )}
          </LUITableCell>
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

export default VendorPage
