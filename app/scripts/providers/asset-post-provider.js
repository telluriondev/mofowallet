/**
 * The MIT License (MIT)
 * Copyright (c) 2016 Krypto Fin ry and the FIMK Developers
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * */
(function () {
'use strict';
var module = angular.module('fim.base');
module.factory('AssetPostProvider', function (nxt, $q, IndexedEntityProvider, CommentProvider) {

  function AssetPostProvider(api, $scope, pageSize, asset) {
    this.init(api, $scope, pageSize);
    this.asset = asset;

    this.subscribe('removedUnConfirmedTransactionsNew', this.removedUnConfirmedTransactions);
    this.subscribe('addedUnConfirmedTransactionsNew', this.addedUnConfirmedTransactions);
    this.subscribe('addedConfirmedTransactionsNew', this.addedConfirmedTransactions);
    this.subscribe('blockPoppedNew', this.blockPopped);
    this.subscribe('blockPushedNew', this.blockPushed);
  }
  angular.extend(AssetPostProvider.prototype, IndexedEntityProvider.prototype, {

    uniqueKey: function (post) { return post.transaction },
    sortFunction: function (a, b) {
      if (b.confirmations < a.confirmations) {      return 1;   }
      else if (b.confirmations > a.confirmations) { return -1;  }
      else {
        if (a.timestamp < b.timestamp) {            return 1;   }
        else if (a.timestamp > b.timestamp) {       return -1;  }
        else {
          if (a.transaction < b.transaction) {      return 1;   }
          else if (a.transaction > b.transaction) { return -1;  }
        }
      }
      return 0;
    },

    getData: function (firstIndex) {
      var deferred = $q.defer();
      var args = {
        asset:       this.asset,
        firstIndex:  firstIndex,
        lastIndex:   firstIndex + this.pageSize
      }
      this.api.engine.socket().getAssetPosts(args).then(deferred.resolve, deferred.reject);
      return deferred.promise;
    },

    dataIterator: function (data) {
      var posts = data || [];
      this.hasMore  = posts.length > 0;
      for (var i=0; i<posts.length; i++) {
        var p   = posts[i];
        p.date  = nxt.util.formatTimestamp(p.timestamp);
        p.text  = p.message;

        p.commentProvider = new CommentProvider(this.api, this.$scope, 10, p.transaction);
      }
      return new Iterator(posts);
    },

    transactionIterator: function (transactions) {
      transactions = transactions || [];
      var filtered = [], t;
      for (var i=0; i<transactions.length; i++) {
        t = transactions[i];
        if (t.type == 1 && t.subtype == 0 && t.senderRS == t.recipientRS) {
          if (t.attachment.message.indexOf('post2:'+this.asset+':') == 0) {
            t.date = nxt.util.formatTimestamp(t.timestamp);
            t.text = t.attachment.message.replace(/^(post2\:[^\:]+\:)/g, '');
            filtered.push(t);
          }
        }
      }
      return new Iterator(filtered);
    }
  });
  return AssetPostProvider;
});
})();