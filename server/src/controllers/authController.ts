import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.ts';
import { User } from '../models/User.ts';
import { generateToken } from '../utils/token.ts';
import { loginSchema } from '../validators/schemas.ts';

export async function login(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parseResult.data;

    // Must explicitly select password because it is omitted by default in schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    if (user.status === 'inactive') {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        title: user.title,
        department: user.department,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      error: error.message,
    });
  }
}

export async function getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
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
      message: 'Failed to fetch current user',
      error: error.message,
    });
  }
}

export async function updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user!;
    const { name, title, department, avatar, password } = req.body;

    if (name) user.name = name;
    if (title) user.title = title;
    if (department) user.department = department;
    if (avatar !== undefined) user.avatar = avatar;

    if (password && password.length >= 6) {
      user.password = password; // Pre-save hook will hash it
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        title: user.title,
        department: user.department,
        avatar: user.avatar,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
}
