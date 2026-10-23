import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { User, IUser } from '../models/User.ts';
import { createUserSchema, updateUserSchema } from '../validators/schemas.ts';

export async function getUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { search, role, status } = req.query;

    const query: any = {};

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (role && typeof role === 'string' && role !== 'all') {
      query.role = role;
    }

    if (status && typeof status === 'string' && status !== 'all') {
      query.status = status;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        title: u.title,
        department: u.department,
        avatar: u.avatar,
        createdAt: u.createdAt,
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users',
      error: error.message,
    });
  }
}

export async function getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        title: user.title,
        department: user.department,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user',
      error: error.message,
    });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = createUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password, role, title, department } = parseResult.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
      return;
    }

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
      title: title || 'Team Member',
      department: department || 'Engineering',
      status: 'active',
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        title: newUser.title,
        department: newUser.department,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
    });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const parseResult = updateUserSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const updates = parseResult.data;

    // Email uniqueness check if changed
    if (updates.email && updates.email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: updates.email.toLowerCase() });
      if (emailExists) {
        res.status(400).json({
          success: false,
          message: 'Email address already in use by another user.',
        });
        return;
      }
      user.email = updates.email.toLowerCase();
    }

    if (updates.name) user.name = updates.name;
    if (updates.role) user.role = updates.role;
    if (updates.status) user.status = updates.status;
    if (updates.title) user.title = updates.title;
    if (updates.department) user.department = updates.department;
    if (updates.avatar !== undefined) user.avatar = updates.avatar;

    if (updates.password && updates.password.length >= 6) {
      user.password = updates.password; // pre-save hook hashes it
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        title: user.title,
        department: user.department,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message,
    });
  }
}

export async function deactivateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    // Prevent admin from deactivating themselves
    if (req.user!._id.toString() === id) {
      res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
      return;
    }

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Toggle status or explicitly set to inactive
    user.status = user.status === 'active' ? 'inactive' : 'active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.status === 'active' ? 'reactivated' : 'deactivated'}.`,
      status: user.status,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message,
    });
  }
}
