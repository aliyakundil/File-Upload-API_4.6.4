import { ObjectId } from "mongodb";
import mongoose from "mongoose";
import User from "../models/User.js";
import bcrypt from "bcrypt";

interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
  };
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
}

interface UpdateUserInput {
  username: string;
  email: string;
  password: string;
  profile: {
    firstName: string;
    lastName: string;
    bio: string;
  };
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  completed?: string;
  priority?: string;
  search?: string;
}

export async function getUsers(options: PaginationQuery) {
  const page = options.page ? parseInt(options.page) : 1;
  const limit = options.limit ? parseInt(options.limit) : 10;
  const offset = (page - 1) * limit;

  const filter: any = {};

  if (options.search) {
    filter.username = { $regex: options.search, $options: "i" };
  }

  const users = await User.find(filter)
    .populate("followers", "username profile")
    .populate("following", "username profile")
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);

  const total = await User.countDocuments(filter);

  return {
    users: users,
    meta: {
      total: total,
      page: page,
      limit: limit,
      totalPage: Math.ceil(total / limit),
    },
  };
}

export async function getUserById(id: string) {
  const user = await User.findById(id)
    .populate("followers", "username profile")
    .populate("following", "username profile");
  return user;
}

export async function createUser(input: CreateUserInput) {
  if (!input.username || input.username.trim() === "")
    throw new Error("Username is required");
  if (!input.password || input.password.trim() === "")
    throw new Error("Password is required");
  const hashPassword = await bcrypt.hash(input.password, 16);
  const newUser = await User.create({
    username: input.username,
    email: input.email,
    password: hashPassword,
    profile: {
      firstName: input.profile.firstName,
      lastName: input.profile.lastName,
      bio: input.profile.bio,
    },
  });

  return newUser;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const userUpdate = await User.findOne({ _id: new ObjectId(id) });

  if (!userUpdate) return null;

  if (input.username !== undefined) userUpdate.username = input.username.trim();
  if (input.email !== undefined) userUpdate.email = input.email;

  await userUpdate.save();

  return userUpdate;
}

export async function patchUser(id: string, input: Partial<UpdateUserInput>) {
  const userPatch = await User.findOne({ _id: new ObjectId(id) });

  if (!userPatch) return null;

  if (input.username !== undefined)
    userPatch.username = input.username.trimEnd();
  if (input.email !== undefined) userPatch.email = input.email;

  const update = await User.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: userPatch },
    { returnDocument: "after" },
  );

  return update ?? null;
}

export async function deleteUser(id: string) {
  const result = await User.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}