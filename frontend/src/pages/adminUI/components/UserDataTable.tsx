// frontend/src/pages/adminUI/components/UserDataTable.tsx
import React, { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnDef
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ArrowUpDown, Download, Lock, Unlock } from "lucide-react";
import Link from 'next/link';
import * as XLSX from 'xlsx';
import { changeUserStatus } from "../../../api/adminAPI/UserManagement";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  status?: string;
  createdAt?: string;
  healthProfile?: {
    gender?: string;
    age?: number | string;
    goal?: string;
    activityLevel?: string;
  };
}

interface UserDataTableProps {
  data: User[];
  refreshData: () => void;
}

const UserDataTable: React.FC<UserDataTableProps> = ({ data, refreshData }) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isLoading, setIsLoading] = useState<{[key: string]: boolean}>({});

  const handleExport = () => {
    console.log("📊 [Admin] Exporting user data to Excel");
    try {
      const exportData = data.map(user => ({
        Name: user.name || '',
        Email: user.email || '',
        Status: user.status || 'active',
        Gender: user.healthProfile?.gender || '',
        Age: user.healthProfile?.age || '',
        Goal: user.healthProfile?.goal || '',
        Activity: user.healthProfile?.activityLevel || '',
        Role: user.role || 'user',
        Registered: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');
      XLSX.writeFile(workbook, 'users.xlsx');
      console.log("✅ [Admin] Successfully exported user data");
    } catch (error) {
      console.error("❌ [Admin] Error exporting user data:", error);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      setIsLoading(prev => ({ ...prev, [userId]: true }));
      console.log(`🔄 [Admin] Toggling user status for user ${userId}`);
      
      const newStatus = currentStatus === "active" ? "suspended" : "active";
      await changeUserStatus(userId, newStatus);
      
      console.log(`✅ [Admin] Successfully changed status for user ${userId} to ${newStatus}`);
      refreshData();
    } catch (error) {
      console.error(`❌ [Admin] Error toggling status for user ${userId}:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Email
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const status = row.original.status || 'active';
        return (
          <Badge 
            variant={status === 'active' ? 'outline' : 'destructive'} 
            className={`text-xs ${status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200 border-green-400' : ''}`}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'gender',
      header: "Gender",
      accessorFn: row => row.healthProfile?.gender || 'none',
    },
    {
      accessorKey: 'age',
      header: "Age",
      accessorFn: row => row.healthProfile?.age ?? 'none',
    },
    {
      accessorKey: 'goal',
      header: "Goal",
      accessorFn: row => row.healthProfile?.goal || 'none',
    },
    {
      accessorKey: 'activity',
      header: "Activity",
      accessorFn: row => row.healthProfile?.activityLevel || 'none',
    },
    {
      accessorKey: 'role',
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role || 'user';
        return (
          <Badge 
            variant={role === 'admin' ? 'outline' : 'secondary'} 
            className={`text-xs ${role === 'admin' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
          >
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            className="p-0 hover:bg-transparent"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Registered
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        );
      },
      accessorFn: row => row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'none',
    },
    {
      id: 'actions',
      header: "",
      cell: ({ row }) => {
        const user = row.original;
        const userId = user.id;
        const userStatus = user.status || 'active';
        const userRole = user.role || 'user';
        
        // Không cho phép disable tài khoản admin
        const isDisabled = userRole === 'admin';
        const isLoading_ = isLoading[userId] || false;
        
        return (
          <div className="flex justify-end gap-2">
            <Button 
              size="sm" 
              variant={userStatus === 'active' ? 'destructive' : 'default'}
              className="h-8 w-8 p-0"
              onClick={() => handleToggleStatus(userId, userStatus)}
              disabled={isDisabled || isLoading_}
              title={userStatus === 'active' ? 'Disable account' : 'Enable account'}
            >
              {isLoading_  ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-20 border-t-white" />
              ) : userStatus === 'active' ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              <span className="sr-only">
                {userStatus === 'active' ? 'Disable account' : 'Enable account'}
              </span>
            </Button>
            
            <Link href={`/adminUI/UserDetails?userId=${userId}`}>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                <Eye className="h-4 w-4" />
                <span className="sr-only">View details</span>
              </Button>
            </Link>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of {data.length} users
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleExport}
          className="flex items-center text-xs"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export Excel
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-medium">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                aria-disabled={!table.getCanPreviousPage()}
                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({length: table.getPageCount()}, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    table.setPageIndex(page - 1);
                  }}
                  isActive={table.getState().pagination.pageIndex === page - 1}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                aria-disabled={!table.getCanNextPage()}
                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default UserDataTable;