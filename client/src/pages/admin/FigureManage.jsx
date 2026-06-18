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
  Avatar,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { adminApi } from "../../api/index.js";
import { formatDate, formatNumber } from "../../utils/helpers.js";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

function FigureManage() {
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
      const result = await adminApi.getFigures();
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
      birthDate: item.birth_date,
      deathDate: item.death_date,
      description: item.description,
      portrait: item.portrait,
      role: item.role,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteFigure(id);
      message.success("删除成功");
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await adminApi.updateFigure(editingItem.id, values);
        message.success("更新成功");
      } else {
        await adminApi.createFigure(values);
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
      title: "头像",
      dataIndex: "portrait",
      key: "portrait",
      width: 60,
      render: (img, record) =>
        img ? (
          <Image
            src={img}
            width={36}
            height={36}
            style={{ borderRadius: "50%", objectFit: "cover" }}
            preview={false}
          />
        ) : (
          <Avatar style={{ background: "#52c41a" }}>{record.name[0]}</Avatar>
        ),
    },
    {
      title: "姓名",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "职务",
      dataIndex: "role",
      key: "role",
      width: 150,
      render: (text) => (text ? <Tag color="green">{text}</Tag> : "-"),
    },
    {
      title: "生卒年月",
      key: "dates",
      width: 220,
      render: (_, record) => (
        <Text type="secondary">
          {record.birth_date && record.death_date
            ? `${formatDate(record.birth_date)} - ${formatDate(record.death_date)}`
            : "-"}
        </Text>
      ),
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
            title="确定删除这个人物吗？"
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
          人物管理
        </Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增人物
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
      />

      <Modal
        title={editingItem ? "编辑人物" : "新增人物"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: "请输入姓名" }]}
          >
            <Input placeholder="请输入人物姓名" maxLength={50} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="birthDate" label="出生日期">
                <Input placeholder="如：1901-11-08" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deathDate" label="逝世日期">
                <Input placeholder="如：1990-09-21" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="role" label="职务">
            <Input placeholder="如：西路军总指挥" maxLength={50} />
          </Form.Item>
          <Form.Item name="portrait" label="头像URL">
            <Input placeholder="请输入头像图片链接" />
          </Form.Item>
          <Form.Item name="description" label="人物介绍">
            <TextArea rows={6} placeholder="请输入人物介绍" maxLength={3000} />
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

export default FigureManage;
