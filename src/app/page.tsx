'use client';
import Cube360Viewer from '@/components/Multires/Scene';
import { Layout } from 'antd';
function HomePage() {
   return (
      <Layout style={{ height: '100vh' }}>
         <Cube360Viewer />
      </Layout>
   );
}

export default HomePage;
