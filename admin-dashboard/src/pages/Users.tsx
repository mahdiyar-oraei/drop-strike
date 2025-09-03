import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { DataGrid, GridColDef, GridRowSelectionModel } from '@mui/x-data-grid';
import { Search as SearchIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { User } from '../types';
import { userApi } from '../services/api';
import { format } from 'date-fns';

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<GridRowSelectionModel>([] as any);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [coinAdjustment, setCoinAdjustment] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [pagination, setPagination] = useState({
    page: 0,
    pageSize: 25,
    total: 0,
  });

  useEffect(() => {
    loadUsers();
  }, [pagination.page, pagination.pageSize, searchTerm, countryFilter, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUsers({
        page: pagination.page + 1,
        limit: pagination.pageSize,
        search: searchTerm || undefined,
        country: countryFilter || undefined,
        isActive: statusFilter ? statusFilter === 'active' : undefined,
        sortBy: 'totalCoinsEarned',
        sortOrder: 'desc',
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(prev => ({
          ...prev,
          total: response.data!.pagination.totalUsers,
        }));
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError('An error occurred while loading users');
      console.error('Users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || (Array.isArray(selectedUsers) && selectedUsers.length === 0)) return;

    try {
      const actionData: any = { reason: actionReason };
      if (bulkAction === 'adjust-coins') {
        actionData.coinAdjustment = parseInt(coinAdjustment);
      }

      const response = await userApi.bulkUserAction(
        bulkAction,
        Array.isArray(selectedUsers) ? selectedUsers : [],
        actionData
      );

      if (response.success) {
        setBulkActionDialog(false);
        setSelectedUsers([] as any);
        setBulkAction('');
        setCoinAdjustment('');
        setActionReason('');
        loadUsers(); // Reload data
      } else {
        setError('Failed to perform bulk action');
      }
    } catch (err) {
      setError('An error occurred during bulk action');
      console.error('Bulk action error:', err);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'name',
      headerName: 'Name',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.email}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 100,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'coins',
      headerName: 'Coins',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {params.value.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            ${(params.value * 0.001).toFixed(2)}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'totalCoinsEarned',
      headerName: 'Total Earned',
      width: 130,
      type: 'number',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
          {params.value.toLocaleString()}
        </Typography>
      ),
    },
    {
      field: 'totalEngagementTime',
      headerName: 'Play Time',
      width: 120,
      renderCell: (params) => {
        const hours = Math.floor(params.value / 3600);
        const minutes = Math.floor((params.value % 3600) / 60);
        return (
          <Typography variant="body2">
            {hours}h {minutes}m
          </Typography>
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'error'}
          size="small"
        />
      ),
    },
    {
      field: 'registrationDate',
      headerName: 'Joined',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
    {
      field: 'lastActiveAt',
      headerName: 'Last Active',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2">
          {format(new Date(params.value), 'MMM dd, yyyy')}
        </Typography>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and monitor all registered users in your game.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={countryFilter}
                label="Country"
                onChange={(e) => setCountryFilter(e.target.value)}
              >
                <MenuItem value="">All Countries</MenuItem>
                <MenuItem value="US">United States</MenuItem>
                <MenuItem value="CA">Canada</MenuItem>
                <MenuItem value="GB">United Kingdom</MenuItem>
                <MenuItem value="DE">Germany</MenuItem>
                <MenuItem value="FR">France</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Users</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                disabled={Array.isArray(selectedUsers) && selectedUsers.length === 0}
                onClick={() => setBulkActionDialog(true)}
              >
                Bulk Actions ({Array.isArray(selectedUsers) ? selectedUsers.length : 0})
              </Button>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => {/* Handle add user */}}
              >
                Add User
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ height: 600 }}>
        <DataGrid
          rows={users}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selectedUsers}
          onRowSelectionModelChange={setSelectedUsers}
          paginationMode="server"
          rowCount={pagination.total}
          paginationModel={{
            page: pagination.page,
            pageSize: pagination.pageSize,
          }}
          onPaginationModelChange={(model) => {
            setPagination(prev => ({
              ...prev,
              page: model.page,
              pageSize: model.pageSize,
            }));
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          getRowId={(row) => row._id}
          sx={{
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        />
      </Paper>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onClose={() => setBulkActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Action</InputLabel>
              <Select
                value={bulkAction}
                label="Action"
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <MenuItem value="activate">Activate Users</MenuItem>
                <MenuItem value="deactivate">Deactivate Users</MenuItem>
                <MenuItem value="adjust-coins">Adjust Coins</MenuItem>
              </Select>
            </FormControl>

            {bulkAction === 'adjust-coins' && (
              <TextField
                fullWidth
                label="Coin Adjustment"
                type="number"
                value={coinAdjustment}
                onChange={(e) => setCoinAdjustment(e.target.value)}
                helperText="Positive number to add coins, negative to deduct"
              />
            )}

            <TextField
              fullWidth
              label="Reason (Optional)"
              multiline
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder="Enter reason for this action..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBulkAction}
            variant="contained"
            disabled={!bulkAction}
          >
            Apply Action
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;
