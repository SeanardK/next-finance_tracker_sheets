"use client";

import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  ColorInput,
  Group,
  Modal,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Tooltip,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconEdit,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useState } from "react";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "@/feature/finance/hooks/use-categories";
import type { Category } from "@/feature/finance/types";

interface CategoryForm {
  name: string;
  parentId: string;
  type: string;
  color: string;
}

export default function CategoriesPage() {
  const { data, isLoading, error } = useCategories();
  const createCat = useCreateCategory();
  const updateCat = useUpdateCategory();
  const deleteCat = useDeleteCategory();

  const [modalOpen, { open, close }] = useDisclosure(false);
  const [editTarget, setEditTarget] = useState<
    (Category & { rowIdx: number }) | null
  >(null);

  const form = useForm<CategoryForm>({
    initialValues: {
      name: "",
      parentId: "",
      type: "expense",
      color: "#868e96",
    },
    validate: { name: (v) => (!v.trim() ? "Name required" : null) },
  });

  function handleEdit(cat: Category, idx: number) {
    setEditTarget({ ...cat, rowIdx: idx + 2 });
    form.setValues({
      name: cat.name,
      parentId: cat.parentId,
      type: cat.type,
      color: cat.color,
    });
    open();
  }

  function handleDelete(cat: Category, idx: number) {
    modals.openConfirmModal({
      title: "Delete category",
      children: `Delete "${cat.name}"?`,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteCat.mutateAsync(idx + 2);
          notifications.show({ color: "green", message: "Category deleted" });
        } catch (err) {
          notifications.show({ color: "red", message: (err as Error).message });
        }
      },
    });
  }

  async function handleSubmit(values: CategoryForm) {
    try {
      if (editTarget) {
        await updateCat.mutateAsync({
          rowId: editTarget.rowIdx,
          data: {
            ...editTarget,
            name: values.name,
            parentId: values.parentId,
            type: values.type as Category["type"],
            color: values.color,
          },
        });
        notifications.show({ color: "green", message: "Category updated" });
      } else {
        await createCat.mutateAsync({
          name: values.name,
          parentId: values.parentId,
          type: values.type as Category["type"],
          color: values.color,
        });
        notifications.show({ color: "green", message: "Category created" });
      }
      form.reset();
      setEditTarget(null);
      close();
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message });
    }
  }

  const categories = data?.categories ?? [];
  const parentOptions = categories
    .filter((c) => !c.parentId)
    .map((c) => ({ value: c.id, label: c.name }));

  return (
    <>
      <Modal
        opened={modalOpen}
        onClose={() => {
          close();
          setEditTarget(null);
          form.reset();
        }}
        title={editTarget ? "Edit Category" : "Add Category"}
        aria-label="Category form"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="sm">
            <TextInput
              label="Name"
              required
              aria-label="Category name"
              {...form.getInputProps("name")}
            />
            <Select
              label="Type"
              data={[
                { value: "expense", label: "Expense" },
                { value: "income", label: "Income" },
                { value: "all", label: "All" },
              ]}
              aria-label="Category type"
              {...form.getInputProps("type")}
            />
            <Select
              label="Parent category (optional)"
              data={parentOptions}
              clearable
              searchable
              aria-label="Parent category"
              {...form.getInputProps("parentId")}
            />
            <ColorInput
              label="Color"
              aria-label="Category color"
              {...form.getInputProps("color")}
            />
            <Group justify="flex-end">
              <Button variant="default" onClick={close} type="button">
                Cancel
              </Button>
              <Button
                type="submit"
                loading={createCat.isPending || updateCat.isPending}
              >
                {editTarget ? "Update" : "Create"}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Group justify="space-between" mb="lg">
        <Title order={2}>Categories</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={open}>
          Add Category
        </Button>
      </Group>

      {error ? (
        <Alert icon={<IconAlertCircle />} color="orange">
          {(error as Error).message}
        </Alert>
      ) : isLoading ? (
        <Skeleton height={300} />
      ) : (
        <Paper withBorder radius="md">
          <Table.ScrollContainer minWidth={500}>
            <Table striped highlightOnHover withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Parent</Table.Th>
                  <Table.Th>Color</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {categories.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text ta="center" c="dimmed" py="xl">
                        No categories yet
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  categories.map((cat, idx) => (
                    <Table.Tr
                      key={cat.id}
                      style={{ paddingLeft: cat.parentId ? 24 : 0 }}
                    >
                      <Table.Td>
                        {cat.parentId && (
                          <Text span c="dimmed" mr={6}>
                            ↳
                          </Text>
                        )}
                        {cat.name}
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm">{cat.type}</Badge>
                      </Table.Td>
                      <Table.Td>
                        {categories.find((c) => c.id === cat.parentId)?.name ??
                          "—"}
                      </Table.Td>
                      <Table.Td>
                        <Group gap={6}>
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 4,
                              background: cat.color,
                              border: "1px solid #dee2e6",
                            }}
                          />
                          <Text size="xs">{cat.color}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Group gap={4}>
                          <Tooltip label="Edit">
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              aria-label="Edit category"
                              onClick={() => handleEdit(cat, idx)}
                            >
                              <IconEdit size={14} />
                            </ActionIcon>
                          </Tooltip>
                          <Tooltip label="Delete">
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              aria-label="Delete category"
                              onClick={() => handleDelete(cat, idx)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      )}
    </>
  );
}
