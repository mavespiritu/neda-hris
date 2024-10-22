import { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

const DataTable = ({ columns, data }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

  const sortedData = () => {
    if (!sortConfig.key) {
      return data;
    }
    const sorted = [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="rounded border">
        <div className="relative w-full overflow-auto">
            <table className="w-full table-fixed caption-bottom text-xs">
            <thead>
                
                <tr>
                    <th className="border-gray-300 p-2 w-8 text-center">#</th>
                {columns.map((column) => (
                    <th
                    key={column.key}
                    onClick={() => handleSort(column.key)}
                    className="border-gray-300 p-2 cursor-pointer"
                    >
                        <div className="flex flex-center items-center gap-2">
                            <span>{column.label}</span>
                            {sortConfig.key === column.key ? (sortConfig.direction === 'ascending' ? <ArrowUp className="mr-2 h-4 w-4" /> : <ArrowDown className="mr-2 h-4 w-4" />) : <ChevronsUpDown className="ml-2 h-4 w-4" />}
                        </div>
                    </th>
                ))}
                </tr>
            </thead>
            <tbody>
            {sortedData().length > 0 ? sortedData().map((row, rowIndex) => (
              <tr key={rowIndex}>
                {/* Index column in tbody */}
                <td className="border-t border-gray-300 p-2 text-center">{rowIndex + 1}</td>
                {columns.map((column) => (
                  <td key={column.key} className="border-t border-gray-300 p-2">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            )) : <tr><td colSpan={columns.length + 1} className="border-t border-gray-300 p-2 text-center">No records found.</td></tr>}
            </tbody>
            </table>
        </div>
    </div>
  );
};

export default DataTable;
