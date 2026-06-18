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
  Image,
  Typography,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { adminApi } from "../../api/index.js";
import { formatNumber } from "../../utils/helpers.js";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

function StorylineManage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await adminApi.getStorylines();
      setData(result);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    form.setFieldsValue({
      title: item.title,
      description: item.description,
      coverImage: item.cover_image,
      sortOrder: item.sort_order,
      status: item.status,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteStoryline(id);
      message.success("删除成功");
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await adminApi.updateStoryline(editingItem.id, values);
        message.success("更新成功");
      } else {
        await adminApi.createStoryline(values);
        message.success("创建成功");
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const columns = [
    {
      title: "封面",
      dataIndex: "cover_image",
      key: "cover_image",
      width: 80,
      render: (img) =>
        img ? (
          <Image
            src={img}
            width={50}
            height={50}
            style={{ borderRadius: 6, objectFit: "cover" }}
            preview={false}
          />
        ) : (
          "-"
        ),
    },
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.description && (
            <div>
              <Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                {record.description}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "章节数",
      dataIndex: "chapter_count",
      key: "chapter_count",
      width: 80,
      render: (v) => <Tag color="blue">{v || 0}</Tag>,
    },
    {
      title: "排序",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 80,
      render: (v) => v || 0,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => {
        const map = {
          draft: {
            color: "default",
            text: "草稿",
            icon: <CloseCircleOutlined />,
          },
          published: {
            color: "success",
            text: "已发布",
            icon: <CheckCircleOutlined />,
          },
          archived: { color: "warning", text: "已归档", icon: <EyeOutlined /> },
        };
        const info = map[status] || map.draft;
        return (
          <Tag color={info.color}>
            {info.icon} {info.text}
          </Tag>
        );
      },
    },
    {
      title: "操作",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除这个故事线吗？"
            description="删除后相关章节也会被删除，此操作不可撤销。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
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
          故事线管理
        </Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增故事线
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
      />

      <Modal
        title={editingItem ? "编辑故事线" : "新增故事线"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="请输入故事线标题" maxLength={100} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入故事线描述" maxLength={500} />
          </Form.Item>
          <Form.Item name="coverImage" label="封面图片URL">
            <Input placeholder="请输入封面图片链接" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <Input type="number" defaultValue={0} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select>
              <Option value="draft">草稿</Option>
              <Option value="published">发布</Option>
              <Option value="archived">归档</Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ margin: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default StorylineManage;
