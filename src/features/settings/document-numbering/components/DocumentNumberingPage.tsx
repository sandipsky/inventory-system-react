import { LUICard, LUITable, LUITableCell, type TableColumn } from '@/components'
import { useDocumentNumberingList } from '../document-numbering.query'
import type { IDocumentNumbering } from '../document-numbering.types'

const columns: TableColumn[] = [
  { key: 'sn', header: 'S.N.', width: '70px' },
  { key: 'name', header: 'Document' },
  { key: 'prefix', header: 'Prefix' },
  { key: 'body_length', header: 'Body Length' },
  { key: 'start_no', header: 'Start No.' },
  { key: 'end_no', header: 'End No.' },
]

const DocumentNumberingPage = () => {
  const { data, isFetching } = useDocumentNumberingList()

  return (
    <LUICard className="table-card">
      <LUITable
        columns={columns}
        data={data ?? []}
        rowKey="id"
        loading={isFetching}
        emptyText="No document numbering found"
      >
        <LUITableCell<IDocumentNumbering> column="sn">
          {({ index }) => index + 1}
        </LUITableCell>
      </LUITable>
    </LUICard>
  )
}

export default DocumentNumberingPage
