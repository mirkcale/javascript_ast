item.meilijie_label_level = (function () {
  return (item.gender == "female" && item.age < 24.5 && item.id_city_risk_level['included']([1, 2]))
    ? 1
    : (item.gender == "female" && item.age < 24.5 && item.id_city_risk_level == 3 && item.cnid_is_country_residence == 0)
      ? 1
      : (item.gender == "female" && item.age < 24.5 && item.id_city_risk_level == 3 && item.cnid_is_country_residence != 0)
        ? 2
        : (item.gender == "female" && item.age >= 24.5 && item.id_city_risk_level['included']([1, 2]))
          ? 2
          : (item.gender == "female" && item.age < 24.5 && item.id_city_risk_level == 4)
            ? 3
            : (item.gender == "female" && item.age >= 24.5 && item.age < 30.5 && item.id_city_risk_level['included']([3, 4]))
              ? 3
              : (item.gender == "male") ? 4 : (item.gender == "female" && item.age >= 30.5 && item.id_city_risk_level['included']([3, 4]))
                ? 4
                : 0;
})();