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
import { Agenda } from '@/screens/Agenda';
import { Indicadores } from '@/screens/Indicadores';
import { TV } from '@/screens/TV';

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
      { path: 'agenda', element: <Agenda /> },
      { path: 'indicadores', element: <Indicadores /> },
      { path: 'tv', element: <TV /> },
    ],
  },
]);
