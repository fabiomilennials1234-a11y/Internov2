import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import { Layout } from '@/components/Layout';
import { Login } from '@/screens/Login';
import { Hub } from '@/screens/Hub';
import { Clientes } from '@/screens/Clientes';
import { ClienteCard } from '@/screens/ClienteCard';
import { Pessoas } from '@/screens/Pessoas';
import { Kanban } from '@/screens/Kanban';
import { Comunicacao } from '@/screens/Comunicacao';
import { EmBreve } from '@/screens/EmBreve';

function Protegido() {
  const token = useAuth((s) => s.accessToken);
  if (!token) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    path: '/',
    element: <Protegido />,
    children: [
      { index: true, element: <Hub /> },
      { path: 'clientes', element: <Clientes /> },
      { path: 'clientes/:id', element: <ClienteCard /> },
      { path: 'pessoas', element: <Pessoas /> },
      { path: 'kanban/:donoId?', element: <Kanban /> },
      { path: 'comunicacao', element: <Comunicacao /> },
      { path: 'agenda', element: <EmBreve titulo="Agenda" /> },
      { path: 'indicadores', element: <EmBreve titulo="Indicadores" /> },
      { path: 'tv', element: <EmBreve titulo="TV-Dashboard" /> },
    ],
  },
]);
