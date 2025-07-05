import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useTagsStore } from '../store/tags';
import { TaskForm } from '../components/tasks/TaskForm';
import { CreateTagRequest } from '../types';
import toast from 'react-hot-toast';

export const CreateTag: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createTag, isLoading } = useTagsStore();

  const handleSubmit = async (data: CreateTagRequest) => {
    if (!user) return;

    try {
      await createTag(data, user.id);
      toast.success('Task created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create task');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <TaskForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isLoading={isLoading}
      mode="create"
    />
  );
};