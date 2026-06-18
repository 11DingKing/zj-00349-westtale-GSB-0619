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
} from "@ant-design/icons";
import { adminApi } from "../../api/index.js";
import { formatNumber } from "../../utils/helpers.js";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

function ArtifactManage() {
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
      const result = await adminApi.getArtifacts();
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
      name: item.name,
      description: item.description,
      image: item.image,
      category: item.category,
      era: item.era,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteArtifact(id);
      message.success("删除成功");
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await adminApi.updateArtifact(editingItem.id, values);
        message.success("更新成功");
      } else {
        await adminApi.createArtifact(values);
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
      title: "图片",
      dataIndex: "image",
      key: "image",
      width: 70,
      render: (img) =>
        img ? (
          <Image
            src={img}
            width={40}
            height={40}
            style={{ borderRadius: 4, objectFit: "cover" }}
            preview={false}
          />
        ) : (
          "-"
        ),
    },
    {
      title: "名称",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "分类",
      dataIndex: "category",
      key: "category",
      width: 100,
      render: (text) => (text ? <Tag color="orange">{text}</Tag> : "-"),
    },
    {
      title: "年代",
      dataIndex: "era",
      key: "era",
      width: 120,
    },
    {
      title: "浏览量",
      dataIndex: "view_count",
      key: "view_count",
      width: 90,
      render: (v) => formatNumber(v),
    },
    {
      title: "操作",
      key: "actions",
      width: 140,
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
            title="确定删除这个文物吗？"
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
          文物管理
        </Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增文物
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
      />

      <Modal
        title={editingItem ? "编辑文物" : "新增文物"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: "请输入名称" }]}
          >
            <Input placeholder="请输入文物名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={4} placeholder="请输入文物描述" maxLength={2000} />
          </Form.Item>
          <Form.Item name="image" label="图片URL">
            <Input placeholder="请输入图片链接" />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Select placeholder="请选择分类">
              <Option value="武器装备">武器装备</Option>
              <Option value="生活用品">生活用品</Option>
              <Option value="宣传品">宣传品</Option>
              <Option value="文书档案">文书档案</Option>
              <Option value="军用品">军用品</Option>
              <Option value="政权建设">政权建设</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="era" label="年代">
            <Input placeholder="如：1936-1937" />
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

export default ArtifactManage;
