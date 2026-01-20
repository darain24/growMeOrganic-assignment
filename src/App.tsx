import { useState, useEffect, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Paginator } from 'primereact/paginator'
import { OverlayPanel } from 'primereact/overlaypanel'
import { Button } from 'primereact/button'
import { InputNumber } from 'primereact/inputnumber'
import type { PaginatorPageChangeEvent } from 'primereact/paginator'
import './App.css'

function App() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<any[]>([])
  const [first, setFirst] = useState(0)
  const [rows] = useState(12)
  const [totalRecords, setTotalRecords] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const panelRef = useRef<OverlayPanel>(null)
  const [selectCount, setSelectCount] = useState<number | null>(null)
  const [error, setError] = useState<string>('')

  const handleSelection = (selectedRows: any[]) => {
    const currentPageIds = new Set(data.map(row => row.id))
    const newSelectedIds = new Set(selectedIds)
    
    currentPageIds.forEach(id => {
      newSelectedIds.delete(id)
    })
    
    selectedRows.forEach(row => {
      newSelectedIds.add(row.id)
    })

    setSelectedIds(newSelectedIds)
  }

  const handleBulkSelect = () => {
    if (!selectCount || selectCount <= 0 || selectCount >= 13) {
      setError('Please enter a number between 1 and 12')
      return
    }

    if (selectCount > data.length) {
      setError(`Only ${data.length} rows available on this page`)
      return
    }

    const ids = new Set(selectedIds)
    const rowsToSelect = data.slice(0, selectCount)
    
    rowsToSelect.forEach(row => {
      ids.add(row.id)
    })

    setSelectedIds(ids)
    panelRef.current?.hide()
    setSelectCount(null)
    setError('')
  }

  const handlePageChange = (e: PaginatorPageChangeEvent) => {
    setFirst(e.first)
    const newPage = Math.floor(e.first / e.rows) + 1
    setPage(newPage)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`https://api.artic.edu/api/v1/artworks?page=${page}`)
        const json = await res.json()
        
        setData(json.data || [])
        setTotalRecords(json.pagination?.total || 0)
      } catch (err) {
        console.error(err)
      }
    }
    fetchData()
  }, [page])

  return (
    <div className='w-full h-screen flex flex-col'>
      <p>Selected Rows: {selectedIds.size}</p>
      
      <div className='flex-1 flex flex-col min-h-0 overflow-hidden'>
        <DataTable
          value={data}
          selection={data.filter(row => selectedIds.has(row.id))}
          onSelectionChange={(e) => handleSelection(e.value)}
          dataKey="id"
          scrollable
          scrollHeight="flex"
          className='styled-datatable w-full'
        >
          <Column
            header={
              <Button
                icon="pi pi-chevron-down"
                className="dropdown-button"
                onClick={(e) => panelRef.current?.toggle(e)}
              />
            }
            selectionMode="multiple"
            headerStyle={{ width: '2rem' }}
          />
          <Column field="title" header="Title" />
          <Column field="place_of_origin" header="Place of Origin" />
          <Column field="artist_title" header="Artist" />
          <Column field="inscriptions" header="Inscription" body={(row) => row.inscriptions || "N/A"} />
          <Column field="date_start" header="Start Date" />
          <Column field="date_end" header="End Date" />
        </DataTable>

        <OverlayPanel ref={panelRef}>
          <div className="flex flex-col gap-3 w-44">
            <label>Select rows (1-12)</label>
            <InputNumber
              value={selectCount}
              onValueChange={(e) => {
                setSelectCount(e.value ?? null)
                setError('')
              }}
              placeholder="Enter number"
              className="w-full bulk-select-input"
              showButtons={false}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button label="Apply" onClick={handleBulkSelect} className="w-full apply-button" />
          </div>
        </OverlayPanel>
      </div>

      <div className='flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white'>
        <div className='text-sm text-gray-700'>
          {totalRecords > 0 
            ? `Showing ${first + 1} to ${Math.min(first + rows, totalRecords)} of ${totalRecords} entries`
            : 'Loading...'
          }
        </div>
        {totalRecords > 0 && (
          <Paginator
            first={first}
            rows={rows}
            totalRecords={totalRecords}
            onPageChange={handlePageChange}
            className='custom-paginator'
            template="PrevPageLink PageLinks NextPageLink"
            pageLinkSize={5}
          />
        )}
      </div>
    </div>
  )
}

export default App
