ActiveRecord::Base.include_root_in_json = false

class ActiveSupport::TimeWithZone
    def as_json(options = {})
        self.to_i*1000
    end
end