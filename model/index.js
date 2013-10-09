var modelizer = require('redis-modelize');

var modelObj = {
  global: {
    userRank: {type: 'zset', refs: true},
    projectRank: {type: 'zset', refs: true},
    reviewRank: {type: 'zset', refs: true}
  },
  user: {
    externalAuthProvider: {type: 'string'},
    externalAuthId: {type: 'string'},
    projects: {type: 'set', refs: true},
    followers: {type: 'set', refs: true},
    following: {type: 'set', refs: true},
    reviews: {type: 'set', refs: true},
    rank: {type: 'string'}
  },
  project: {
    _obj: {
      type: 'hash',
      reverse: ['name'],
      props: {
	name: {html: 'input', mandatory: true},
	tags: {html: 'input', mandatory: true},
	desc: {html: 'text'}
      }
    },
    users: {type: 'set', refs: true},
    reviews: {type: 'set', refs: true},
    followers: {type: 'set', refs: true},
    rank: {type: 'string'}
  },
  review: {
    _obj: {
      type: 'hash',
      props: {
	rank: {html: 'input', mandatory: true},
	text: {html: 'text', mandatory: true},
	user: {mandatory: true, refs: true},
	target: {mandatory: true, refs: true}
      }
    },
    rank: {type: 'string'},
    reviews: {type: 'set', refs: true}
  }
};


modelizer.init(modelObj);

exports=modelizer;