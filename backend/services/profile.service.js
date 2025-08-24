import { dbRun, dbGet, dbAll } from '../config/database.js';
import { validateNickname, nicknameExists, generateUniqueNickname, cleanNickname } from '../utils/nickname.utils.js';

class ProfileService {
  static async getAllProfiles() {
    const profiles = await dbAll('SELECT * FROM profiles');
    return profiles;
  }


  static async getIdByNick(nick) {
    const id = await dbGet(
      'SELECT userId FROM profiles WHERE nickname = ?',
      [nick]
    );
    if (!id) {
      throw new Error (`[ProfileService] No such user with nickname ${nick} found`)
    }
    return id;
  }


  static async getProfileById(id) {
    const profile = await dbGet('SELECT * FROM profiles WHERE id = ?', [id]);
    return profile;
  }

  static async getProfileByUserId(userId) {
    const profile = await dbGet('SELECT * FROM profiles WHERE userId = ?', [userId]);
    return profile;
  }

  static async updateProfile(id, profileData) {
    const { nickname, profilePictureUrl, bio } = profileData;
    
    // Validate nickname if provided
    if (nickname !== undefined) {
      const validation = validateNickname(nickname);
      if (!validation.isValid) {
        throw new Error(`Nickname validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Check if nickname already exists for another user
      const existingProfile = await dbGet(
        'SELECT userId FROM profiles WHERE nickname = ? AND userId != ?',
        [nickname, id]
      );
      
      if (existingProfile) {
        throw new Error('Nickname already taken by another user');
      }
    }
    
    // Build dynamic update query based on provided fields
    const updateFields = [];
    const updateValues = [];
    
    if (nickname !== undefined) {
      updateFields.push('nickname = ?');
      updateValues.push(nickname);
    }
    if (profilePictureUrl !== undefined) {
      updateFields.push('profilePictureUrl = ?');
      updateValues.push(profilePictureUrl);
    }
    if (bio !== undefined) {
      updateFields.push('bio = ?');
      updateValues.push(bio);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    updateFields.push('updatedAt = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    const result = await dbRun(
      `UPDATE profiles SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    if (result.changes === 0) {
      throw new Error('Profile not found');
    }
    
    return this.getProfileById(id);
  }

  static async updateProfileField(id, field, value) {
    const allowedFields = ['nickname', 'profilePictureUrl', 'bio'];
    
    if (!allowedFields.includes(field)) {
      throw new Error('Invalid field');
    }

    // Special validation for nickname updates
    if (field === 'nickname') {
      const validation = validateNickname(value);
      if (!validation.isValid) {
        throw new Error(`Nickname validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Check if nickname already exists for another user
      const existingProfile = await dbGet(
        'SELECT userId FROM profiles WHERE nickname = ? AND userId != ?',
        [value, id]
      );
      
      if (existingProfile) {
        throw new Error('Nickname already taken by another user');
      }
    }

    const result = await dbRun(
      `UPDATE profiles SET ${field} = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      [value, id]
    );
    
    if (result.changes === 0) {
      throw new Error('Profile not found');
    }
    
    return this.getProfileById(id);
  }

  static async suggestNickname(baseNickname) {
    try {
      const cleanedNickname = cleanNickname(baseNickname);
      return await generateUniqueNickname(cleanedNickname);
    } catch (error) {
      throw new Error('Failed to generate nickname suggestion');
    }
  }
}

export default ProfileService;