import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Drawer, Dropdown, Space } from "antd";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import {
  HomeOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TeamOutlined,
  MenuOutlined,
  UserOutlined,
  DashboardOutlined,
} from "@ant-design/icons";

const { Header, Content, Footer } = Layout;

function VisitorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState("home");

  useEffect(() => {
    const path = location.pathname;
    if (path === "/") setSelectedKey("home");
    else if (path.startsWith("/artifacts")) setSelectedKey("artifacts");
    else if (path.startsWith("/figures")) setSelectedKey("figures");
    else if (path.startsWith("/storyline")) setSelectedKey("storylines");
  }, [location.pathname]);

  const menuItems = [
    { key: "home", icon: <HomeOutlined />, label: <Link to="/">首页</Link> },
    {
      key: "storylines",
      icon: <HistoryOutlined />,
      label: <Link to="/">故事线</Link>,
    },
    {
      key: "artifacts",
      icon: <AppstoreOutlined />,
      label: <Link to="/artifacts">文物展</Link>,
    },
    {
      key: "figures",
      icon: <TeamOutlined />,
      label: <Link to="/figures">英烈谱</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: "admin",
      icon: <DashboardOutlined />,
      label: "后台管理",
      onClick: () => navigate("/admin"),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          padding: "0 24px",
          background: "linear-gradient(90deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 20,
                fontWeight: "bold",
              }}
            >
              西
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1.2,
                }}
              >
                西征悲歌
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                西路军历史数字展陈
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={[selectedKey]}
              items={menuItems}
              style={{
                border: "none",
                background: "transparent",
                minWidth: 400,
              }}
            />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Button
                type="text"
                icon={<UserOutlined />}
                style={{ color: "#fff" }}
              />
            </Dropdown>

            <Button
              type="text"
              icon={<MenuOutlined />}
              style={{ color: "#fff", display: "none" }}
              onClick={() => setMobileMenuOpen(true)}
            />
          </div>
        </div>
      </Header>

      <Drawer
        title="导航菜单"
        placement="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={() => setMobileMenuOpen(false)}
        />
      </Drawer>

      <Content style={{ flex: 1 }}>
        <Outlet />
      </Content>

      <Footer
        style={{
          textAlign: "center",
          background: "#1a1a2e",
          color: "rgba(255,255,255,0.7)",
          padding: "24px 50px",
        }}
      >
        <Space direction="vertical" size="small">
          <div style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>
            西征悲歌 · 西路军历史数字展陈
          </div>
          <div style={{ fontSize: 12 }}>
            铭记历史 · 缅怀先烈 · 珍爱和平 · 开创未来
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
            © {new Date().getFullYear()} 西路军历史研究会 版权所有
          </div>
        </Space>
      </Footer>
    </Layout>
  );
}

export default VisitorLayout;
