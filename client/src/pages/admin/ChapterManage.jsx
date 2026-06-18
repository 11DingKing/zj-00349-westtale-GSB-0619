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
  Switch,
  List,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { adminApi } from "../../api/index.js";
import { formatDate, formatNumber } from "../../utils/helpers.js";

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

function ChapterManage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [storylines, setStorylines] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [figures, setFigures] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();
  const [imageList, setImageList] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chapters, sls, arts, figs] = await Promise.all([
        adminApi.getChapters(),
        adminApi.getStorylines(),
        adminApi.getArtifacts(),
        adminApi.getFigures(),
      ]);
      setData(chapters);
      setStorylines(sls);
      setArtifacts(arts);
      setFigures(figs);
    } catch (err) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setImageList([]);
    setModalOpen(true);
  };

  const handleEdit = async (item) => {
    try {
      setEditingItem(item);
      const detail = await adminApi.getChapter(item.id);
      form.setFieldsValue({
        storylineId: detail.storyline_id,
        title: detail.title,
        date: detail.date,
        content: detail.content,
        videoUrl: detail.video_url,
        sortOrder: detail.sort_order,
        status: detail.status,
        artifacts: detail.artifacts || [],
        figures: detail.figures || [],
      });
      setImageList(detail.images || []);
      setModalOpen(true);
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.deleteChapter(id);
      message.success("删除成功");
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleStatusChange = async (id, checked) => {
    try {
      await adminApi.updateChapterStatus(id, checked ? "published" : "draft");
      message.success("状态更新成功");
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        ...values,
        images: imageList,
      };
      if (editingItem) {
        await adminApi.updateChapter(editingItem.id, submitData);
        message.success("更新成功");
      } else {
        await adminApi.createChapter(submitData);
        message.success("创建成功");
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      message.error(err.message);
    }
  };

  const addImage = () => {
    if (newImageUrl && !imageList.includes(newImageUrl)) {
      setImageList([...imageList, newImageUrl]);
      setNewImageUrl("");
    }
  };

  const removeImage = (index) => {
    setImageList(imageList.filter((_, i) => i !== index));
  };

  const columns = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div>
            <Tag color="blue" style={{ fontSize: 11 }}>
              {record.storyline_title}
            </Tag>
          </div>
        </div>
      ),
    },
    {
      title: "日期",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (v) => formatDate(v),
    },
    {
      title: "浏览",
      dataIndex: "view_count",
      key: "view_count",
      width: 80,
      render: (v) => formatNumber(v),
    },
    {
      title: "献花",
      dataIndex: "flower_count",
      key: "flower_count",
      width: 80,
      render: (v) => formatNumber(v),
    },
    {
      title: "留言",
      dataIndex: "comment_count",
      key: "comment_count",
      width: 80,
      render: (v) => formatNumber(v),
    },
    {
      title: "排序",
      dataIndex: "sort_order",
      key: "sort_order",
      width: 70,
      render: (v) => v || 0,
    },
    {
      title: "发布",
      key: "status",
      width: 80,
      render: (_, record) => (
        <Switch
          checked={record.status === "published"}
          onChange={(checked) => handleStatusChange(record.id, checked)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
        />
      ),
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
            title="确定删除这个章节吗？"
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
          章节管理
        </Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增章节
        </Button>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={columns}
      />

      <Modal
        title={editingItem ? "编辑章节" : "新增章节"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="storylineId"
                label="所属故事线"
                rules={[{ required: true, message: "请选择故事线" }]}
              >
                <Select placeholder="请选择故事线">
                  {storylines.map((sl) => (
                    <Option key={sl.id} value={sl.id}>
                      {sl.title}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="日期"
                rules={[{ required: true, message: "请输入日期" }]}
              >
                <Input placeholder="如：1936-10-24" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: "请输入标题" }]}
          >
            <Input placeholder="请输入章节标题" maxLength={100} />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: "请输入内容" }]}
          >
            <TextArea
              rows={6}
              placeholder="请输入章节详细内容"
              maxLength={5000}
            />
          </Form.Item>
          <Form.Item label="图片">
            <Space.Compact style={{ width: "100%", marginBottom: 8 }}>
              <Input
                placeholder="输入图片URL"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                onPressEnter={addImage}
              />
              <Button icon={<UploadOutlined />} onClick={addImage}>
                添加
              </Button>
            </Space.Compact>
            {imageList.length > 0 && (
              <List
                size="small"
                dataSource={imageList}
                locale={{ emptyText: "暂无图片" }}
                renderItem={(item, index) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        danger
                        size="small"
                        onClick={() => removeImage(index)}
                      >
                        删除
                      </Button>,
                    ]}
                  >
                    <Image
                      src={item}
                      width={40}
                      height={40}
                      style={{ objectFit: "cover", borderRadius: 4 }}
                      preview={false}
                    />
                    <Text ellipsis style={{ marginLeft: 12, flex: 1 }}>
                      {item}
                    </Text>
                  </List.Item>
                )}
              />
            )}
          </Form.Item>
          <Form.Item name="videoUrl" label="视频链接">
            <Input placeholder="请输入视频URL（可选）" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="artifacts" label="关联文物">
                <Select mode="multiple" placeholder="选择关联文物">
                  {artifacts.map((a) => (
                    <Option key={a.id} value={a.id}>
                      {a.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="figures" label="关联人物">
                <Select mode="multiple" placeholder="选择关联人物">
                  {figures.map((f) => (
                    <Option key={f.id} value={f.id}>
                      {f.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sortOrder" label="排序">
                <Input type="number" defaultValue={0} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select>
                  <Option value="draft">草稿</Option>
                  <Option value="published">发布</Option>
                  <Option value="archived">归档</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
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

export default ChapterManage;
