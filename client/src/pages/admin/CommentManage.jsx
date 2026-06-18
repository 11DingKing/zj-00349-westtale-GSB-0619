import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  message,
  Tag,
  Popconfirm,
  Typography,
  Avatar,
  Badge,
  Tabs,
  Card,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { adminApi } from "../../api/index.js";
import { formatDateTime } from "../../utils/helpers.js";

const { Text, Paragraph } = Typography;
const { TabPane } = Tabs;

function CommentManage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
  });

  useEffect(() => {
    loadData();
  }, [activeTab, pagination.page, pagination.pageSize]);

  const loadData = async () => {
    try {
      setLoading(true);
      const status = activeTab === "all" ? undefined : activeTab;
      const result = await adminApi.getComments({
        status,
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      setData(result.list);
      setPagination((prev) => ({ ...prev, total: result.total }));
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await adminApi.approveComment(id);
      message.success("审核通过");
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await adminApi.rejectComment(id);
      message.success("已拒绝");
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteComment(id);
      message.success("删除成功");
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const getStatusTag = (status) => {
    const map = {
      pending: {
        color: "warning",
        text: "待审核",
        icon: <ClockCircleOutlined />,
      },
      approved: { color: "success", text: "已通过", icon: <CheckOutlined /> },
      rejected: { color: "error", text: "已拒绝", icon: <CloseOutlined /> },
    };
    const info = map[status] || map.pending;
    return (
      <Tag color={info.color}>
        {info.icon} {info.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: "访客",
      dataIndex: "visitor_name",
      key: "visitor_name",
      width: 120,
      render: (text) => (
        <Space>
          <Avatar style={{ background: "#1890ff" }}>{text?.[0] || "游"}</Avatar>
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "留言内容",
      dataIndex: "content",
      key: "content",
      render: (text) => (
        <div>
          <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
            {text}
          </Paragraph>
        </div>
      ),
    },
    {
      title: "所属章节",
      dataIndex: "chapter_title",
      key: "chapter_title",
      width: 150,
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "点赞",
      dataIndex: "like_count",
      key: "like_count",
      width: 70,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: "时间",
      dataIndex: "created_at",
      key: "created_at",
      width: 160,
      render: (v) => formatDateTime(v),
    },
    {
      title: "操作",
      key: "actions",
      width: 180,
      render: (_, record) => (
        <Space size="small">
          {record.status === "pending" && (
            <>
              <Button
                size="small"
                type="primary"
                ghost
                icon={<CheckOutlined />}
                onClick={() => handleApprove(record.id)}
              >
                通过
              </Button>
              <Button
                size="small"
                danger
                ghost
                icon={<CloseOutlined />}
                onClick={() => handleReject(record.id)}
              >
                拒绝
              </Button>
            </>
          )}
          <Popconfirm
            title="确定删除这条留言吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Text strong style={{ fontSize: 16 }}>
          留言审核
        </Text>
      </div>

      <Card
        style={{ borderRadius: 8, border: "none" }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: "0 24px" }}
          items={[
            {
              key: "pending",
              label: (
                <span>
                  <ClockCircleOutlined /> 待审核
                </span>
              ),
            },
            {
              key: "approved",
              label: (
                <span>
                  <CheckOutlined /> 已通过
                </span>
              ),
            },
            {
              key: "rejected",
              label: (
                <span>
                  <CloseOutlined /> 已拒绝
                </span>
              ),
            },
            {
              key: "all",
              label: (
                <span>
                  <MessageOutlined /> 全部
                </span>
              ),
            },
          ]}
        />
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条留言`,
            onChange: (page, pageSize) =>
              setPagination((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>
    </div>
  );
}

export default CommentManage;
