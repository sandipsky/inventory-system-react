import { useState } from 'react'
import { isAxiosError } from 'axios'
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
import { useCategories, useDeleteCategory } from '../category.query'
import type { ICategory } from '../category.types'
import CategoryForm from './CategoryForm'

const columns: TableColumn[] = [
  { key: 'sn', header: 'S.N.', width: '70px' },
  { key: 'name', header: 'Name', sortable: true },
  { key: 'isActive', header: 'Status', width: '120px', align: 'center' },
  { key: 'actions', header: 'Actions', width: '110px', align: 'center' },
]

const filterColumns: FilterColumn[] = [
  {
    name: 'Status', formcontrolName: 'isActive', type: 'select', data: [
      { id: '1', name: 'Active' },
      { id: '0', name: 'Inactive' },
    ]
  }
];

const getErrorMessage = (error: unknown) =>
  isAxiosError(error)
    ? ((error.response?.data as { message?: string } | undefined)?.message ?? error.message)
    : 'Something went wrong'

const CategoryPage = () => {
  const drawer = useLUIDrawer()
  const modal = useLUIModal()
  const notify = useLUINotification()

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [sort, setSort] = useState<TableSort | null>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})

  const { data, isFetching } = useCategories({
    pageIndex,
    pageSize,
    ...(sort && { sort: `${sort.key}:${sort.direction}` }),
    ...filters,
  })
  const deleteCategory = useDeleteCategory()

  const categories = data?.content ?? []
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

  const openForm = (category?: ICategory) => {
    drawer.open<boolean>((ref) => <CategoryForm drawerRef={ref} category={category} />, {
      size: '420px',
    })
  }

  const confirmDelete = (category: ICategory) => {
    const ref = modal.open<boolean>(
      (modalRef) => (
        <LUIConfirmDialog
          modalRef={modalRef}
          data={{
            title: 'Delete Category',
            message: `Are you sure you want to delete "${category.name}"? This cannot be undone.`,
            confirmText: 'Delete',
            onConfirm: () =>
              deleteCategory.mutateAsync(category.id).catch((error) => {
                notify.error('Delete Failed', getErrorMessage(error))
                throw error
              }),
          }}
        />
      ),
      { width: '420px' },
    )

    void ref.afterClosed().then((confirmed) => {
      if (confirmed) notify.success('Category Deleted', `"${category.name}" has been removed.`)
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

        <LUIButton onClick={() => openForm()}>Add Category</LUIButton>
      </LUIFlex>

      <LUICard className="table-card">
        <LUITable
          columns={columns}
          data={categories}
          rowKey="id"
          serverSort
          sort={sort}
          onSortChange={onSortChange}
          loading={isFetching}
          emptyText="No categories found"
        >
          <LUITableCell<ICategory> column="sn">
            {({ index }) => pageIndex * pageSize + index + 1}
          </LUITableCell>

          <LUITableCell<ICategory> column="isActive">
            {({ row }) => (
              <LUIChip variant={row.is_active ? 'success' : 'error'} dot>
                {row.is_active ? 'Active' : 'Inactive'}
              </LUIChip>
            )}
          </LUITableCell>

          <LUITableCell<ICategory> column="actions">
            {({ row }) => (
              <LUIFlex justify="center" gap="small">
                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`Edit ${row.name}`}
                  onClick={() => openForm(row)}
                >
                  <LUIIcon name='edit' size={16} />
                </LUIButton>

                <LUIButton
                  variant="outlined"
                  size="sm"
                  rounded
                  aria-label={`Delete ${row.name}`}
                  onClick={() => confirmDelete(row)}
                >
                  <LUIIcon name='trash' size={16} />
                </LUIButton>
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

export default CategoryPage
