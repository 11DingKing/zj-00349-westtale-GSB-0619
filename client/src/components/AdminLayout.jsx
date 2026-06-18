import React, { useState } from "react";
import { Layout, Menu, Typography, Avatar, Dropdown, Space } from "antd";
import {
  DashboardOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TeamOutlined,
  CommentOutlined,
  LogoutOutlined,
  HomeOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === "/admin") return "dashboard";
    if (path.includes("/admin/storylines")) return "storylines";
    if (path.includes("/admin/chapters")) return "chapters";
    if (path.includes("/admin/artifacts")) return "artifacts";
    if (path.includes("/admin/figures")) return "figures";
    if (path.includes("/admin/comments")) return "comments";
    return "dashboard";
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: "数据看板",
      onClick: () => navigate("/admin"),
    },
    {
      key: "storylines",
      icon: <HistoryOutlined />,
      label: "故事线管理",
      onClick: () => navigate("/admin/storylines"),
    },
    {
      key: "chapters",
      icon: <BookOutlined />,
      label: "章节管理",
      onClick: () => navigate("/admin/chapters"),
    },
    {
      key: "artifacts",
      icon: <AppstoreOutlined />,
      label: "文物管理",
      onClick: () => navigate("/admin/artifacts"),
    },
    {
      key: "figures",
      icon: <TeamOutlined />,
      label: "人物管理",
      onClick: () => navigate("/admin/figures"),
    },
    {
      key: "comments",
      icon: <CommentOutlined />,
      label: "留言审核",
      onClick: () => navigate("/admin/comments"),
    },
  ];

  const userMenuItems = [
    {
      key: "home",
      icon: <HomeOutlined />,
      label: "返回前台",
      onClick: () => navigate("/"),
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: () => navigate("/"),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{
          background: "linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)",
        }}
      >
        <div
          style={{
            padding: "20px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 18,
                fontWeight: "bold",
                flexShrink: 0,
              }}
            >
              西
            </div>
            {!collapsed && (
              <div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    lineHeight: 1.2,
                  }}
                >
                  西征悲歌
                </div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>
                  管理后台
                </div>
              </div>
            )}
          </div>
        </div>

        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ border: "none", background: "transparent", marginTop: 16 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: "#fff",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Title level={4} style={{ margin: 0 }}>
            内容管理系统
          </Title>
          <Space>
            <Text type="secondary">欢迎，管理员</Text>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar style={{ background: "#c41e3a", cursor: "pointer" }}>
                管
              </Avatar>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ padding: 24, background: "#f5f5f5" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
