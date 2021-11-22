const bcrypt = require('bcryptjs')
const db = require('../models')
const User = db.User
const imgur = require('imgur-node-api')
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID
const Favorite = db.Favorite
const Like = db.Like
const Comment = db.Comment
const Restaurant = db.Restaurant
const Followship = db.Followship
const helpers = require('../_helpers')
const user = require('../models/user')

const userController = {
  signUpPage: (req, res) => {
    return res.render('signup')
  },

  signUp: (req, res) => {
    if (req.body.passwordCheck !== req.body.password) {
      req.flash('error_messages', '兩次密碼輸入不同！')
      return res.redirect('/signup')
    } else {
      // confirm unique user
      User.findOne({ where: { email: req.body.email } }).then(user => {
        if (user) {
          req.flash('error_messages', '信箱重複！')
          return res.redirect('/signup')
        } else {
          User.create({
            name: req.body.name,
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10), null)
          }).then(user => {
            req.flash('success_messages', '成功註冊帳號！')
            return res.redirect('/signin')
          })
        }
      })
    }
  },

  signInPage: (req, res) => {
    return res.render('signin')
  },

  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },

  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  getUser: async (req, res) => {
    try {
      const isEditable = helpers.getUser(req).id === Number(req.params.id) || false

      let user = await User.findByPk(helpers.getUser(req).id)

      const comment = await Comment.findAll({
        raw: true,
        nest: true,
        where: { UserId: req.params.id },
        include: [Restaurant]
      })
      let count = comment.length
      let thisUser = await User.findByPk(req.params.id)

      return res.render('profile', { thisUser: thisUser.toJSON(), user: user.toJSON(), comment, count, isEditable })

    } catch (e) {
      console.log('error');
    }
  },

  editUser: (req, res) => {
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      req.flash('error_messages', "無使用者權限")
      return res.redirect(`/users/${helpers.getUser(req).id}`)
    }
    return User.findByPk(req.params.id)
      .then()
      .then(user => res.render('edit', { user: user.toJSON() }))
  },

  putUser: async (req, res) => {
    try {
      const { file } = await req
      if (helpers.getUser(req).id !== Number(req.params.id)) {
        req.flash('error_messages', "無使用者權限")
        return res.redirect(`/users/${helpers.getUser(req).id}`)
      }
      let user = await User.findByPk(req.params.id)

      await user.update(
        {
          name: req.body.name,
          email: req.body.email,
        })
      imgur.setClientID(IMGUR_CLIENT_ID)
      await file ? imgur.upload(file.path, async (err, img) => {
        try {
          await user.update(
            {
              image: img.data.link
            })
          req.flash('success_messages', '使用者資料編輯成功')
          return res.redirect(`/users/${req.params.id}`)
        } catch (e) { console.log(e); }
      }) :
        req.flash('success_messages', '使用者資料編輯成功'),
        res.redirect(`/users/${req.params.id}`)
    } catch (e) {
      console.log(e);
    }




    // const { file } = req

    // if (helpers.getUser(req).id !== Number(req.params.id)) {
    //   req.flash('error_messages', "無使用者權限")
    //   return res.redirect(`/users/${helpers.getUser(req).id}`)
    // }


    // if (file) {
    //   imgur.setClientID(IMGUR_CLIENT_ID)
    //   imgur.upload(file.path, (err, img) => {
    //     return User.findByPk(req.params.id)
    //       .then(user => {
    //         user.update({
    //           name: req.body.name,
    //           email: req.body.email,
    //           image: file ? img.data.link : null
    //         })
    //           .then(() => {
    //             req.flash('success_messages', '使用者資料編輯成功')
    //             return res.redirect(`/users/${req.params.id}`)
    //           })
    //       })
    //   })
    // } else {
    //   return User.findByPk(req.params.id)
    //     .then(user => {
    //       user.update({
    //         name: req.body.name,
    //         email: req.body.email,
    //         image: user.image
    //       })
    //         .then(() => {
    //           req.flash('success_messages', '使用者資料編輯成功')
    //           return res.redirect(`/users/${req.params.id}`)
    //         })
    //     })
    // }

  },


  // // 還沒修該好的版本
  // let path = file ? file.path : 'err'
  // let data = {}
  // imgur.setClientID(IMGUR_CLIENT_ID)
  // imgur.upload(file.path, (err, img) => {
  //   console.log(err);
  //   if (err) {
  //     console.log('gag');
  //     data = {
  //       name: req.body.name,
  //       email: req.body.email
  //     }
  //   } else {
  //     data = {
  //       name: req.body.name,
  //       email: req.body.email,
  //       image: img.data.link
  //     }
  //   }
  //   // return User.findByPk(req.params.id)
  //   //   .then(user => {
  //   //     user.update(data)
  //   //   })
  //   //   .then(() => {
  //   //     req.flash('success_messages', '使用者資料編輯成功')
  //   //     return res.redirect(`/users/${req.params.id}`)
  //   //   })
  // })
  // },

  addFavorite: (req, res) => {
    return Favorite.create({
      UserId: req.user.id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },
  removeFavorite: (req, res) => {
    return Favorite.destroy({
      where: {
        userId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },
  addLike: (req, res) => {
    return Like.create({
      UserId: helpers.getUser(req).id,
      RestaurantId: req.params.restaurantId
    })
      .then((restaurant) => {
        return res.redirect('back')
      })
  },
  removeLike: (req, res) => {
    return Like.destroy({
      where: {
        UserId: helpers.getUser(req).id,
        RestaurantId: req.params.restaurantId
      }
    })
      .then((deletedLike) => {
        return res.redirect('back')
      })
  },
  getTopUser: (req, res) => {
    // 撈出所有 User 與 followers 資料
    return User.findAll({
      include: [
        { model: User, as: 'Followers' }
      ]
    }).then(users => {
      // 整理 users 資料
      users = users.map(user => ({
        ...user.dataValues,
        // 計算追蹤者人數
        FollowerCount: user.Followers.length,
        // 判斷目前登入使用者是否已追蹤該 User 物件
        isFollowed: req.user.Followings.map(d => d.id).includes(user.id)
      }))
      // 依追蹤者人數排序清單
      users = users.sort((a, b) => b.FollowerCount - a.FollowerCount)
      return res.render('topUser', { users: users })
    })
  },
  addFollowing: (req, res) => {
    return Followship.create({
      followerId: req.user.id,
      followingId: req.params.userId
    })
      .then((followship) => {
        return res.redirect('back')
      })
  },

  removeFollowing: (req, res) => {
    return Followship.findOne({
      where: {
        followerId: req.user.id,
        followingId: req.params.userId
      }
    })
      .then((followship) => {
        followship.destroy()
          .then((followship) => {
            return res.redirect('back')
          })
      })
  },
  removeImage: (req, res) => {
    if (helpers.getUser(req).id !== Number(req.params.id)) {
      req.flash('error_messages', "無使用者權限")
      return res.redirect(`/users/${helpers.getUser(req).id}`)
    }
    return User.findByPk(req.params.id)
      .then(user => {
        user.update({
          image: ''
        })
          .then(() => {
            req.flash('success_messages', '刪除照片成功')
            return res.redirect('back')
          })
      })
  }
}


module.exports = userController