import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from '../routes/LoginPage';
import { InventoryHomePage } from '../routes/InventoryHomePage';
import { InventoryProductsPage } from '../routes/InventoryProductsPage';
import { InventoryMovementsPage } from '../routes/InventoryMovementsPage';
import { InventoryOptimizationPage } from '../routes/InventoryOptimizationPage';
import { InventoryAlertsPage } from '../routes/InventoryAlertsPage';
import { PrivateRoute } from '../features/auth/PrivateRoute';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/inventario" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <PrivateRoute />,
    children: [
      { path: '/inventario', element: <InventoryHomePage /> },
      { path: '/inventories/:inventoryId/products', element: <InventoryProductsPage /> },
      { path: '/inventories/:inventoryId/movements', element: <InventoryMovementsPage /> },
      { path: '/inventories/:inventoryId/optimization', element: <InventoryOptimizationPage /> },
      { path: '/inventories/:inventoryId/alerts', element: <InventoryAlertsPage /> }
    ]
  },
  { path: '*', element: <Navigate to="/inventario" replace /> }
]);
