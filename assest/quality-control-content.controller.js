import angular from 'angular';
import html2canvas from 'html2canvas';

function ModifiedCompaniesController($http, toaster, $rootScope, $uibModalInstance, company, data, type) {
  var vm = this;
  // vm.companies = companies;


  function cancel() {
    $uibModalInstance.dismiss('cancel');
  }


  function getChecking() {
    $http.get('pycredit/report', { params: vm.params }).then(function (res) {
      var data = res.data;
      vm.checking = data;
    })
  }
  function getCompanyNameChecking() {
    $http.get('pycredit/corporationCheck', { params: vm.params }).then(function (res) {
      var data = res.data;
      vm.checking = data;
    })
  }
  function checkingScreenshot() {
    html2canvas(document.getElementById('CheckingImage')).then(
      (canvas) => {
        var html_canvas = canvas.toDataURL('image/jpeg', '1.0');
        $http.post('pycredit/uploadDocument',
          {
            data: html_canvas,
            applicationId: data.applicationId,
            docType: 'admin_uploaded',
          })
          .then(() => {
            toaster.pop('success', '操作成功', '本次鹏元反查结果已成功上传至本单证明文件，请留意');
            vm.cancel()
            $rootScope.$broadcast('reloadImg');
          })
      }
    )
  }


  vm.cancel = cancel;
  vm.checkingScreenshot = checkingScreenshot;
  vm.type = type;
  vm.params = {
    applicationId: data.applicationId,
    mobile: company.telphone,
    companyName: company.name,
  }
  if (vm.type === 'companyName') {
    getCompanyNameChecking();
  } else {
    getChecking()
  }

}
ModifiedCompaniesController.$inject = ['$http', 'toaster', '$rootScope', '$uibModalInstance', 'company', 'data', 'type'];

function HistoryCompaniesController($http, $uibModalInstance, company) {
  var vm = this;
  // vm.companies = companies;

  function cancel() {
    $uibModalInstance.dismiss('cancel');
  }
  function getModifiedHistories() {
    $http.get('histories/companies/' + company.id).then(function (res) {
      var data = res.data;
      vm.histories = data;
    })
  }

  vm.cancel = cancel;
  getModifiedHistories();

}

HistoryCompaniesController.$inject = ['$http', '$uibModalInstance', 'company'];

export function ApplyCompanyController($http, $filter, $uibModal, toaster, storageService, dialService, regExp, permissionService, $scope, $sce) {
  var company = {};
  var vm = this;
  vm.opened = true;
  vm.simplePhonePatt = regExp.simplePhone;
  vm.areas = storageService.getItem('areas');

  function edit() {
    vm.isEditState = true
  }



  function dial(calledNo, item) {
    if (item) {
      item.dialing = true;
    } else {
      vm.dialing = true;
    }
    dialService.dial({
      applicationId: vm.data.applicationId,
      dialoutType: '1',
      calledNo: calledNo,
      source: 'approval-center',
      insertIndex: 0
    }, $scope).then(function () {
      setTimeout(function () {
        if (item) {
          item.dialing = false;
        } else {
          vm.dialing = false;
        }
      }, 5000)
    })
  }

  function openModifiedHistoriesModal() {
    $uibModal.open({
      templateUrl: 'modifiedCompaniesModal.html',
      controller: HistoryCompaniesController,
      controllerAs: 'vm',
      size: 'lg',
      resolve: {
        company: function () { return vm.company }
      }
    })
  }
  function openCheckingModal(type) {

    $uibModal.open({
      templateUrl: 'CheckingModal.html',
      controller: ModifiedCompaniesController,
      controllerAs: 'vm',
      size: 'lg',
      resolve: {
        company: function () { return vm.company },
        data: function () { return vm.data },
        type: function () {
          return type || ''
        }
      }
    })
  }

  function toDate() {
    if (vm.company && vm.company.entryTime) vm.entryTime = new Date(vm.company.entryTime);
  }

  function toTimestamp() {
    if (vm.entryTime) vm.company.entryTime = new Date(vm.entryTime).getTime();
  }

  function backup() {
    company = angular.copy(vm.company);
  }

  function reset() {
    vm.company = angular.copy(company);
  }

  function transformAddress() {
    if (vm.company.address) vm.company.address.description = $filter('address')(vm.company.address)
  }

  vm.fetchHistoryCompanyMobileName = function () {
    $http.get('applications/company/tel?applicationId=' + vm.data.applicationId).then(function (res) {
      vm.telephoneInfo = angular.forEach(res.data.telephoneInfo, function (item) {
        item.opened = false;
        item.dialing = false;
        item.hitKey = $sce.trustAsHtml(item.hitKey);
        return item
      });

    });
  }
  function cancel() {
    vm.isEditState = false;
    reset();
    toDate();
  }
  vm.closeOtherPopover = function (item) {
    vm.showPopoverData = item;
    item.opened = true;
    angular.forEach(vm.telephoneInfo, function (i) {
      item.applicationId !== i.applicationId && (i.opened = false);
    })
  }
  $scope.$watch('vm.company.telphone', function () {
    vm.company.telphone = $filter('deleteNonnumeric')(vm.company.telphone)
  })

  function getCompanyNameChecking() {
    var params = {
      applicationId: vm.data.applicationId || '',
      mobile: vm.company.telphone || '',
      companyName: vm.company.name || '',
      requestSource: 'bairong',
    }
    $http.get('pycredit/corporationCheck', { params: params }).then(function (res) {
      var checkResult = res.data.checkResult;
      vm.consistent = checkResult === 2 || checkResult === 3;
      vm.checkResult = checkResult === -1
        ? '未调用' :
        vm.consistent ? '一致' : '不一致';
    })
  }

  function save() {
    vm.isEditState = false;
    transformAddress();
    toTimestamp();

    $http.put('applications/' + vm.data.applicationId + '/company/' + vm.company.id, vm.company).then(function () {
      backup();
      vm.onUpdate();
      toaster.pop('success', '保存成功', '公司信息已更新');
    })
  }

  function $onInit() {
    vm.TBPro = vm.data.productCode.indexOf('LOAN-OWNER-HEXINHOUSE') > -1 || vm.data.productCode.indexOf('LOAN-BUSINESS-HEXINHOUSE') > -1;
    backup();
    toDate();
    vm.fetchHistoryCompanyMobileName();
    getCompanyNameChecking();
  }

  vm.$onInit = $onInit;
  vm.dial = dial;
  vm.edit = edit;
  vm.save = save;
  vm.cancel = cancel;
  vm.hasPermission = permissionService.hasPermission;
  vm.openModifiedHistoriesModal = openModifiedHistoriesModal;
  vm.openCheckingModal = openCheckingModal;
}
ApplyCompanyController.$inject = ['$http', '$filter', '$uibModal', 'toaster', 'storageService', 'dialService', 'regExp', 'permissionService', '$scope', '$sce'];
